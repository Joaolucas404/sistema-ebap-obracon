insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('report-photos', 'report-photos', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('service-order-files', 'service-order-files', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('pdf-archive', 'pdf-archive', false, 52428800, array['application/pdf']),
  ('sst-documents', 'sst-documents', false, 52428800, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('inventory-files', 'inventory-files', false, 20971520, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('contract-files', 'contract-files', false, 52428800, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('purchase-files', 'purchase-files', false, 20971520, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'storage_read_app_files',
        'storage_insert_app_files',
        'storage_update_app_files',
        'storage_delete_app_files'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create policy "storage_read_app_files"
on storage.objects for select
using (bucket_id in ('report-photos','service-order-files','pdf-archive','sst-documents','inventory-files','contract-files','purchase-files'));

create policy "storage_insert_app_files"
on storage.objects for insert
with check (bucket_id in ('report-photos','service-order-files','pdf-archive','sst-documents','inventory-files','contract-files','purchase-files'));

create policy "storage_update_app_files"
on storage.objects for update
using (bucket_id in ('report-photos','service-order-files','pdf-archive','sst-documents','inventory-files','contract-files','purchase-files'))
with check (bucket_id in ('report-photos','service-order-files','pdf-archive','sst-documents','inventory-files','contract-files','purchase-files'));

create policy "storage_delete_app_files"
on storage.objects for delete
using (bucket_id in ('report-photos','service-order-files','pdf-archive','sst-documents','inventory-files','contract-files','purchase-files'));
