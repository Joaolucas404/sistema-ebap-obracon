-- Fase 9 - RLS Almoxarifado
-- Politicas preparadas para perfis almoxarifado, gerencia e diretoria.
-- Leitura inclui anon por compatibilidade com a autenticacao propria atual do app.
-- Escritas do modulo devem passar pelas RPCs da migration principal, que validam p_user_id.

alter table public.almoxarifado_locais enable row level security;
alter table public.almoxarifado_itens enable row level security;
alter table public.movimentacoes_estoque enable row level security;

drop policy if exists "almox_read_profiles" on public.almoxarifado_itens;
drop policy if exists "almox_write_profiles" on public.almoxarifado_itens;
drop policy if exists "almox_locais_rw" on public.almoxarifado_locais;
drop policy if exists "movimentacoes_read_profiles" on public.movimentacoes_estoque;
drop policy if exists "movimentacoes_write_profiles" on public.movimentacoes_estoque;

create policy "almox_locais_read_profiles"
on public.almoxarifado_locais
for select
using (
  ativo = true
  and public.current_app_role() in ('anon','almoxarifado','gerencia','diretoria','service_role')
);

create policy "almox_locais_write_profiles"
on public.almoxarifado_locais
for all
using (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'));

create policy "almox_itens_read_profiles"
on public.almoxarifado_itens
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','almoxarifado','gerencia','diretoria','service_role')
);

create policy "almox_itens_write_profiles"
on public.almoxarifado_itens
for all
using (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'));

create policy "movimentacoes_estoque_read_profiles"
on public.movimentacoes_estoque
for select
using (public.current_app_role() in ('anon','almoxarifado','gerencia','diretoria','service_role'));

create policy "movimentacoes_estoque_insert_profiles"
on public.movimentacoes_estoque
for insert
with check (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'));
