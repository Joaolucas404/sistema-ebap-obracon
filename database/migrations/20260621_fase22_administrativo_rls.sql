alter table public.adm_colaboradores enable row level security;
alter table public.adm_ferias enable row level security;
alter table public.adm_atestados enable row level security;
alter table public.adm_documentos enable row level security;
alter table public.adm_veiculos enable row level security;
alter table public.adm_frota_manutencoes enable row level security;
alter table public.adm_historico enable row level security;

drop policy if exists "adm_colaboradores_read_fase22" on public.adm_colaboradores;
drop policy if exists "adm_colaboradores_write_fase22" on public.adm_colaboradores;
drop policy if exists "adm_ferias_read_fase22" on public.adm_ferias;
drop policy if exists "adm_ferias_write_fase22" on public.adm_ferias;
drop policy if exists "adm_atestados_read_fase22" on public.adm_atestados;
drop policy if exists "adm_atestados_write_fase22" on public.adm_atestados;
drop policy if exists "adm_documentos_read_fase22" on public.adm_documentos;
drop policy if exists "adm_documentos_write_fase22" on public.adm_documentos;
drop policy if exists "adm_veiculos_read_fase22" on public.adm_veiculos;
drop policy if exists "adm_veiculos_write_fase22" on public.adm_veiculos;
drop policy if exists "adm_frota_manutencoes_read_fase22" on public.adm_frota_manutencoes;
drop policy if exists "adm_frota_manutencoes_write_fase22" on public.adm_frota_manutencoes;
drop policy if exists "adm_historico_read_fase22" on public.adm_historico;
drop policy if exists "adm_historico_insert_fase22" on public.adm_historico;

create policy "adm_colaboradores_read_fase22" on public.adm_colaboradores for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_colaboradores_write_fase22" on public.adm_colaboradores for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_ferias_read_fase22" on public.adm_ferias for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_ferias_write_fase22" on public.adm_ferias for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_atestados_read_fase22" on public.adm_atestados for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_atestados_write_fase22" on public.adm_atestados for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_documentos_read_fase22" on public.adm_documentos for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_documentos_write_fase22" on public.adm_documentos for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_veiculos_read_fase22" on public.adm_veiculos for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_veiculos_write_fase22" on public.adm_veiculos for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_frota_manutencoes_read_fase22" on public.adm_frota_manutencoes for select using (deleted_at is null and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_frota_manutencoes_write_fase22" on public.adm_frota_manutencoes for all using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

create policy "adm_historico_read_fase22" on public.adm_historico for select using (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "adm_historico_insert_fase22" on public.adm_historico for insert with check (public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));

drop policy if exists "admin_files_read_fase22" on storage.objects;
drop policy if exists "admin_files_insert_fase22" on storage.objects;
drop policy if exists "admin_files_update_fase22" on storage.objects;
drop policy if exists "admin_files_delete_fase22" on storage.objects;

create policy "admin_files_read_fase22" on storage.objects for select using (bucket_id = 'admin-files' and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "admin_files_insert_fase22" on storage.objects for insert with check (bucket_id = 'admin-files' and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "admin_files_update_fase22" on storage.objects for update using (bucket_id = 'admin-files' and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role')) with check (bucket_id = 'admin-files' and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
create policy "admin_files_delete_fase22" on storage.objects for delete using (bucket_id = 'admin-files' and public.current_app_role() in ('administrativo','gerencia','diretoria','service_role'));
