-- Fase 10.1 - RLS SST Base
-- Leitura inclui anon por compatibilidade com a autenticacao propria atual do app.
-- Escritas devem preferir as RPCs da migration principal, que validam p_user_id.

alter table public.epi_itens enable row level security;
alter table public.epi_entregas enable row level security;
alter table public.treinamentos enable row level security;
alter table public.funcionario_treinamentos enable row level security;
alter table public.apr enable row level security;

drop policy if exists "epi_itens_read_profiles" on public.epi_itens;
drop policy if exists "epi_itens_write_profiles" on public.epi_itens;
drop policy if exists "epi_entregas_read_profiles" on public.epi_entregas;
drop policy if exists "epi_entregas_write_profiles" on public.epi_entregas;
drop policy if exists "treinamentos_read_profiles" on public.treinamentos;
drop policy if exists "treinamentos_write_profiles" on public.treinamentos;
drop policy if exists "funcionario_treinamentos_read_profiles" on public.funcionario_treinamentos;
drop policy if exists "funcionario_treinamentos_write_profiles" on public.funcionario_treinamentos;
drop policy if exists "apr_read_profiles" on public.apr;
drop policy if exists "apr_write_profiles" on public.apr;

create policy "epi_itens_read_profiles"
on public.epi_itens
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "epi_itens_write_profiles"
on public.epi_itens
for all
using (public.current_app_role() in ('sst','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','gerencia','diretoria','service_role'));

create policy "epi_entregas_read_profiles"
on public.epi_entregas
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "epi_entregas_write_profiles"
on public.epi_entregas
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));

create policy "treinamentos_read_profiles"
on public.treinamentos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "treinamentos_write_profiles"
on public.treinamentos
for all
using (public.current_app_role() in ('sst','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','gerencia','diretoria','service_role'));

create policy "funcionario_treinamentos_read_profiles"
on public.funcionario_treinamentos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "funcionario_treinamentos_write_profiles"
on public.funcionario_treinamentos
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));

create policy "apr_read_profiles"
on public.apr
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "apr_write_profiles"
on public.apr
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));
