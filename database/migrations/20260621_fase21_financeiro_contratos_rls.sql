alter table public.contratos enable row level security;
alter table public.medicoes enable row level security;
alter table public.financeiro_lancamentos enable row level security;
alter table public.financeiro_documentos enable row level security;
alter table public.financeiro_historico enable row level security;

drop policy if exists "financeiro_contratos_read_fase21" on public.contratos;
drop policy if exists "financeiro_contratos_write_fase21" on public.contratos;
drop policy if exists "financeiro_medicoes_read_fase21" on public.medicoes;
drop policy if exists "financeiro_medicoes_write_fase21" on public.medicoes;
drop policy if exists "financeiro_lancamentos_read_fase21" on public.financeiro_lancamentos;
drop policy if exists "financeiro_lancamentos_write_fase21" on public.financeiro_lancamentos;
drop policy if exists "financeiro_documentos_read_fase21" on public.financeiro_documentos;
drop policy if exists "financeiro_documentos_write_fase21" on public.financeiro_documentos;
drop policy if exists "financeiro_historico_read_fase21" on public.financeiro_historico;
drop policy if exists "financeiro_historico_insert_fase21" on public.financeiro_historico;

create policy "financeiro_contratos_read_fase21"
on public.contratos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role')
);

create policy "financeiro_contratos_write_fase21"
on public.contratos
for all
using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'));

create policy "financeiro_medicoes_read_fase21"
on public.medicoes
for select
using (
  deleted_at is null
  and public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role')
);

create policy "financeiro_medicoes_write_fase21"
on public.medicoes
for all
using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'));

create policy "financeiro_lancamentos_read_fase21"
on public.financeiro_lancamentos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role')
);

create policy "financeiro_lancamentos_write_fase21"
on public.financeiro_lancamentos
for all
using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'));

create policy "financeiro_documentos_read_fase21"
on public.financeiro_documentos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role')
);

create policy "financeiro_documentos_write_fase21"
on public.financeiro_documentos
for all
using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'));

create policy "financeiro_historico_read_fase21"
on public.financeiro_historico
for select
using (public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role'));

create policy "financeiro_historico_insert_fase21"
on public.financeiro_historico
for insert
with check (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role'));

drop policy if exists "contract_files_read_fase21" on storage.objects;
drop policy if exists "contract_files_insert_fase21" on storage.objects;
drop policy if exists "contract_files_update_fase21" on storage.objects;
drop policy if exists "contract_files_delete_fase21" on storage.objects;

create policy "contract_files_read_fase21"
on storage.objects
for select
using (
  bucket_id = 'contract-files'
  and public.current_app_role() in ('financeiro','gerencia','diretoria','prefeitura','service_role')
);

create policy "contract_files_insert_fase21"
on storage.objects
for insert
with check (
  bucket_id = 'contract-files'
  and public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')
);

create policy "contract_files_update_fase21"
on storage.objects
for update
using (
  bucket_id = 'contract-files'
  and public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')
)
with check (
  bucket_id = 'contract-files'
  and public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')
);

create policy "contract_files_delete_fase21"
on storage.objects
for delete
using (
  bucket_id = 'contract-files'
  and public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')
);
