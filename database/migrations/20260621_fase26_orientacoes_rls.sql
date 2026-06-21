alter table public.orientacoes enable row level security;
alter table public.orientacao_anexos enable row level security;
alter table public.orientacao_versoes enable row level security;

drop policy if exists "orientacoes_read_profiles_fase26" on public.orientacoes;
drop policy if exists "orientacoes_insert_profiles_fase26" on public.orientacoes;
drop policy if exists "orientacoes_update_profiles_fase26" on public.orientacoes;
drop policy if exists "orientacoes_delete_profiles_fase26" on public.orientacoes;
drop policy if exists "orientacao_anexos_read_profiles_fase26" on public.orientacao_anexos;
drop policy if exists "orientacao_anexos_write_profiles_fase26" on public.orientacao_anexos;
drop policy if exists "orientacao_versoes_read_profiles_fase26" on public.orientacao_versoes;
drop policy if exists "orientacao_versoes_insert_profiles_fase26" on public.orientacao_versoes;

create policy "orientacoes_read_profiles_fase26"
on public.orientacoes
for select
using (
  deleted_at is null
  and public.current_app_role() in (
    'anon','operador','tecnico','cco','supervisor','gerencia','diretoria','prefeitura',
    'sst','administrativo','almoxarifado','financeiro','service_role'
  )
);

create policy "orientacoes_insert_profiles_fase26"
on public.orientacoes
for insert
with check (
  public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role')
);

create policy "orientacoes_update_profiles_fase26"
on public.orientacoes
for update
using (
  public.current_app_role() in ('anon','gerencia','diretoria','service_role')
)
with check (true);

create policy "orientacoes_delete_profiles_fase26"
on public.orientacoes
for delete
using (
  public.current_app_role() in ('anon','diretoria','service_role')
);

create policy "orientacao_anexos_read_profiles_fase26"
on public.orientacao_anexos
for select
using (
  deleted_at is null
  and public.current_app_role() in (
    'anon','operador','tecnico','cco','supervisor','gerencia','diretoria','prefeitura',
    'sst','administrativo','almoxarifado','financeiro','service_role'
  )
);

create policy "orientacao_anexos_write_profiles_fase26"
on public.orientacao_anexos
for all
using (
  public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role')
)
with check (true);

create policy "orientacao_versoes_read_profiles_fase26"
on public.orientacao_versoes
for select
using (
  public.current_app_role() in (
    'anon','operador','tecnico','cco','supervisor','gerencia','diretoria','prefeitura',
    'sst','administrativo','almoxarifado','financeiro','service_role'
  )
);

create policy "orientacao_versoes_insert_profiles_fase26"
on public.orientacao_versoes
for insert
with check (
  public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role')
);

drop policy if exists "storage_read_orientation_files" on storage.objects;
drop policy if exists "storage_insert_orientation_files" on storage.objects;
drop policy if exists "storage_update_orientation_files" on storage.objects;
drop policy if exists "storage_delete_orientation_files" on storage.objects;

create policy "storage_read_orientation_files"
on storage.objects for select
using (bucket_id = 'orientation-files');

create policy "storage_insert_orientation_files"
on storage.objects for insert
with check (bucket_id = 'orientation-files');

create policy "storage_update_orientation_files"
on storage.objects for update
using (bucket_id = 'orientation-files')
with check (bucket_id = 'orientation-files');

create policy "storage_delete_orientation_files"
on storage.objects for delete
using (bucket_id = 'orientation-files');
