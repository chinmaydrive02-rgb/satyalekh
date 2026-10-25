-- Additive migration. Run as database owner; no client role receives table access.
create table if not exists public.acquisition_workers (
 id uuid primary key, owner_id uuid references auth.users(id), token_hash text not null,
 pairing_hash text unique, pairing_expires_at timestamptz not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 last_seen timestamptz not null default now(), revoked boolean not null default false
);
create table if not exists public.acquisition_jobs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 worker_id uuid not null references public.acquisition_workers(id), request jsonb not null,
 status text not null default 'queued' check(status in ('queued','running','awaiting_captcha','completed','failed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '15 minutes'),
 lease_hash text, lease_expires_at timestamptz,
 challenge_id uuid, image_base64 text, challenge_expires_at timestamptz,
 answer text, answer_submitted boolean not null default false,
 result jsonb, source_base64 text, source_sha256 text, source_as_of text,
 retrieved_at timestamptz, failure_code text
);
create unique index if not exists acquisition_one_active_job on public.acquisition_jobs(worker_id)
 where status in ('queued','running','awaiting_captcha');
create index if not exists acquisition_owner_jobs on public.acquisition_jobs(owner_id,created_at desc);
alter table public.acquisition_workers enable row level security;
alter table public.acquisition_jobs enable row level security;
revoke all on public.acquisition_workers,public.acquisition_jobs from public,anon,authenticated;
grant all on public.acquisition_workers,public.acquisition_jobs to service_role;

create or replace function public.acquisition_action(action text,args jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 w public.acquisition_workers; j public.acquisition_jobs; result jsonb; answer_value text;
 begin
 -- All state transitions run in one transaction. Worker locking serializes claim,
 -- pairing, disconnect and job transitions without a cross-process memory lock.
 if action='register' then
  insert into public.acquisition_workers(id,token_hash,pairing_hash,pairing_expires_at,expires_at)
  values((args->>'worker_id')::uuid,args->>'token_hash',args->>'pairing_hash',now()+interval '10 minutes',now()+interval '8 hours') returning * into w;
  return jsonb_build_object('pairing_expires_at',w.pairing_expires_at,'expires_at',w.expires_at);
 elsif action='connect' then
  select * into w from public.acquisition_workers where pairing_hash=args->>'pairing_hash' for update;
  if w.id is null or w.revoked or w.owner_id is not null or w.pairing_expires_at<=now() or w.expires_at<=now() then
   return jsonb_build_object('error','Pairing code is invalid or expired.','status',409);
  end if;
  update public.acquisition_workers set owner_id=(args->>'owner_id')::uuid,pairing_hash=null where id=w.id;
  return jsonb_build_object('worker_id',w.id,'connected',true,'expires_at',w.expires_at);
 elsif action='workers' then
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'worker_id',id,'device_id',id,
   'online',last_seen>now()-interval '45 seconds' and expires_at>now(),'last_seen',last_seen,'expires_at',expires_at)
   order by created_at desc),'[]'::jsonb) into result from public.acquisition_workers
   where owner_id=(args->>'owner_id')::uuid and not revoked and expires_at>now();
  return jsonb_build_object('workers',result);
 end if;

 if action in ('read','source','answer') then
  -- Lock worker before job in every branch, avoiding a completion/read deadlock.
  select a.* into w from public.acquisition_workers a join public.acquisition_jobs b on b.worker_id=a.id
   where b.id=(args->>'job_id')::uuid and b.owner_id=(args->>'owner_id')::uuid for update of a;
 else
  select * into w from public.acquisition_workers where id=(args->>'worker_id')::uuid for update;
 end if;
 if w.id is null then return jsonb_build_object('error','Retrieval request not found.','status',404); end if;
 if action in ('disconnect','create') then
  if w.owner_id is distinct from (args->>'owner_id')::uuid then
   return jsonb_build_object('error','Retrieval device not found.','status',404);
  end if;
 elsif action not in ('read','source','answer') then
  if w.revoked or w.expires_at<=now() or w.token_hash<>args->>'token_hash' then
   return jsonb_build_object('error','Invalid or expired retrieval device token.','status',401);
  end if;
  update public.acquisition_workers set last_seen=now() where id=w.id;
 end if;

 -- Expired leases fail explicitly. Never requeue a live CAPTCHA or replay it.
 update public.acquisition_jobs set status='failed',failure_code='session_expired',
  answer=null,image_base64=null,updated_at=now()
 where worker_id=w.id and status in ('queued','running','awaiting_captcha') and
  (expires_at<=now() or (status<>'queued' and lease_expires_at<=now()) or
   (status='awaiting_captcha' and challenge_expires_at<=now()) or w.revoked or w.expires_at<=now());

 if action='disconnect' then
  update public.acquisition_workers set revoked=true,token_hash='',pairing_hash=null where id=w.id;
  update public.acquisition_jobs set status='failed',failure_code='cancelled',answer=null,image_base64=null,updated_at=now()
   where worker_id=w.id and status in ('queued','running','awaiting_captcha');
  return jsonb_build_object('disconnected',true);
 elsif action='create' then
  if w.revoked or w.expires_at<=now() or w.last_seen<=now()-interval '45 seconds' then
   return jsonb_build_object('error','Retrieval device is offline. Open the worker first.','status',409);
  end if;
  if exists(select 1 from public.acquisition_jobs where worker_id=w.id and status in ('queued','running','awaiting_captcha')) then
   return jsonb_build_object('error','This device already has an active retrieval.','status',409);
  end if;
  insert into public.acquisition_jobs(owner_id,worker_id,request)
   values(w.owner_id,w.id,args->'request') returning * into j;
  return jsonb_build_object('id',j.id,'status',j.status,'expires_at',j.expires_at);
 elsif action='poll' then
  if w.owner_id is null then return jsonb_build_object('connected',false); end if;
  -- A heartbeat renews the current lease while the worker awaits a user answer.
  update public.acquisition_jobs set lease_expires_at=now()+interval '60 seconds'
   where worker_id=w.id and status in ('running','awaiting_captcha');
  select * into j from public.acquisition_jobs where worker_id=w.id and owner_id=w.owner_id and status='queued'
   order by created_at limit 1 for update;
  if j.id is null then return jsonb_build_object('connected',true); end if;
  update public.acquisition_jobs set status='running',lease_hash=encode(sha256(convert_to(args->>'lease_token','UTF8')),'hex'),
   lease_expires_at=now()+interval '60 seconds',updated_at=now() where id=j.id;
  return jsonb_build_object('connected',true,'job',jsonb_build_object('id',j.id,'lease_token',args->>'lease_token','request',j.request));
 end if;

 select * into j from public.acquisition_jobs where id=(args->>'job_id')::uuid and worker_id=w.id for update;
 if j.id is null or (action in ('read','source','answer') and j.owner_id is distinct from (args->>'owner_id')::uuid) then
  return jsonb_build_object('error','Retrieval request not found.','status',404);
 end if;
 if action='read' then
  result=jsonb_build_object('id',j.id,'status',j.status,'request',j.request,'created_at',j.created_at,
    'expires_at',j.expires_at,'failure_code',j.failure_code);
  if j.status='awaiting_captcha' then
   result=result||jsonb_build_object('challenge_id',j.challenge_id,'image_base64',j.image_base64,
     'challenge_expires_at',j.challenge_expires_at);
  elsif j.status='completed' then result=result||jsonb_build_object('result',j.result); end if;
  return result;
 elsif action='source' then
  if j.status<>'completed' then return jsonb_build_object('error','Source is not available.','status',409); end if;
  return jsonb_build_object('source_base64',j.source_base64,'source_sha256',j.source_sha256);
 elsif action='answer' then
  if j.status<>'awaiting_captcha' or j.challenge_id is distinct from (args->>'challenge_id')::uuid or j.answer_submitted then
   return jsonb_build_object('error','This challenge is expired or already answered.','status',409);
  end if;
  update public.acquisition_jobs set answer=args->>'answer',answer_submitted=true,updated_at=now() where id=j.id;
  return jsonb_build_object('accepted',true);
 end if;

 -- Worker credentials alone do not permit crossing job leases or owners.
 if j.owner_id is distinct from w.owner_id or j.lease_hash is null or
  j.lease_hash<>encode(sha256(convert_to(args->>'lease_token','UTF8')),'hex') then
  return jsonb_build_object('error','Invalid retrieval lease.','status',403);
 end if;
 if j.status not in ('running','awaiting_captcha') then
  if action in ('control','heartbeat') then return jsonb_build_object('status',j.status); end if;
  return jsonb_build_object('error','Retrieval has already ended.','status',409);
 end if;
 update public.acquisition_jobs set lease_expires_at=now()+interval '60 seconds' where id=j.id;
 if action='heartbeat' then return jsonb_build_object('status',j.status);
 elsif action='original' then return jsonb_build_object('request',j.request);
 elsif action='control' then
  answer_value=j.answer;
  if answer_value is not null then
   update public.acquisition_jobs set answer=null,image_base64=null,status='running',updated_at=now() where id=j.id;
  end if;
  return jsonb_build_object('status',case when answer_value is null then j.status else 'running' end,'answer',answer_value);
 elsif action='challenge' then
  if j.status<>'running' or j.challenge_id is not null then
   return jsonb_build_object('error','Challenge already created. Start a new retrieval if rejected.','status',409);
  end if;
  update public.acquisition_jobs set status='awaiting_captcha',challenge_id=gen_random_uuid(),
   image_base64=args->>'image_base64',challenge_expires_at=least(expires_at,now()+interval '600 seconds'),
   answer_submitted=false,updated_at=now() where id=j.id returning * into j;
  return jsonb_build_object('challenge_id',j.challenge_id,'expires_at',j.challenge_expires_at);
 elsif action='complete' then
  if j.status<>'running' or not j.answer_submitted or j.answer is not null then
   return jsonb_build_object('error','A user challenge answer must be consumed first.','status',409);
  end if;
  update public.acquisition_jobs set status='completed',result=args->'result',source_base64=args->>'source_base64',
   source_sha256=args->>'source_sha256',source_as_of=args->>'source_as_of',retrieved_at=(args->>'retrieved_at')::timestamptz,
   image_base64=null,answer=null,updated_at=now() where id=j.id;
  return jsonb_build_object('id',j.id,'status','completed');
 elsif action='fail' then
  update public.acquisition_jobs set status='failed',failure_code=args->>'message',image_base64=null,answer=null,updated_at=now() where id=j.id;
  return jsonb_build_object('id',j.id,'status','failed');
 end if;
 return jsonb_build_object('error','Unknown acquisition action.','status',400);
end $$;
revoke all on function public.acquisition_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.acquisition_action(text,jsonb) to service_role;
