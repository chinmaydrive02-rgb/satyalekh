-- Transactional RLS regression check; leaves no test rows.
begin;
do $test$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); row_id uuid:=gen_random_uuid(); n int;
begin
insert into public.portfolio_assets(id,owner_id,survey_no) values(row_id,a,'SECURITY-ISOLATION-TEST');
perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
set local role authenticated;
select count(*) into n from public.portfolio_assets where id=row_id;
if n<>1 then raise exception 'Owner cannot read own row'; end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
select count(*) into n from public.portfolio_assets where id=row_id;
if n<>0 then raise exception 'Cross-account read allowed'; end if;
update public.portfolio_assets set notes='unauthorized' where id=row_id;
get diagnostics n = row_count;
if n<>0 then raise exception 'Cross-account write allowed'; end if;
begin
insert into public.portfolio_assets(owner_id,survey_no) values(a,'FORGED-OWNER');
raise exception 'Forged owner insert allowed';
exception when insufficient_privilege then null;
end;
reset role;
end $test$;
rollback;
