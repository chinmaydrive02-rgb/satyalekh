-- Preserve legacy records without assigning them to an unverified account.
alter table public.portfolio_assets add column if not exists owner_id uuid;
alter table public.locker_documents add column if not exists owner_id uuid;
alter table public.watchlist add column if not exists owner_id uuid;
alter table public.manual_orders add column if not exists owner_id uuid;
alter table public.title_reports add column if not exists owner_id uuid;
create index if not exists idx_portfolio_owner on public.portfolio_assets(owner_id);
create index if not exists idx_locker_owner on public.locker_documents(owner_id);
create index if not exists idx_watchlist_owner on public.watchlist(owner_id);
create index if not exists idx_orders_owner on public.manual_orders(owner_id);
create index if not exists idx_reports_owner on public.title_reports(owner_id);
do $$
declare p record; t text;
begin
 foreach t in array array['portfolio_assets','locker_documents','watchlist','manual_orders','title_reports','watchlist_alerts','payments','user_credits','village_cache','survey_options'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',p.policyname,t);
  end loop;
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select,insert,update,delete on public.portfolio_assets,public.locker_documents to authenticated;
create policy portfolio_owner_access on public.portfolio_assets for all to authenticated
 using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy locker_owner_access on public.locker_documents for all to authenticated
 using ((select auth.uid()) = owner_id) with check (
 (select auth.uid()) = owner_id and split_part(storage_path,'/',1) = (select auth.uid())::text);
update storage.buckets set public=false,file_size_limit=15728640,
 allowed_mime_types=array['application/pdf','image/jpeg','image/png','image/webp']
 where id='lockers';
drop policy if exists "locker upload" on storage.objects;
drop policy if exists "locker read" on storage.objects;
drop policy if exists "locker delete" on storage.objects;
drop policy if exists locker_authenticated_upload on storage.objects;
drop policy if exists locker_authenticated_read on storage.objects;
drop policy if exists locker_authenticated_delete on storage.objects;
create policy locker_authenticated_upload on storage.objects for insert to authenticated
 with check (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy locker_authenticated_read on storage.objects for select to authenticated
 using (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy locker_authenticated_delete on storage.objects for delete to authenticated
 using (bucket_id='lockers' and (storage.foldername(name))[1]=(select auth.uid())::text);
