-- Fase 10.2 - RLS SST Avancado
-- Leitura inclui anon por compatibilidade com autenticacao propria atual do app.
-- Escritas devem preferir as RPCs com validacao por p_user_id.

alter table public.apt enable row level security;
alter table public.inspecoes enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.planos_acao enable row level security;

drop policy if exists "apt_read_profiles" on public.apt;
drop policy if exists "apt_write_profiles" on public.apt;
drop policy if exists "inspecoes_read_profiles" on public.inspecoes;
drop policy if exists "inspecoes_write_profiles" on public.inspecoes;
drop policy if exists "ocorrencias_read_profiles" on public.ocorrencias;
drop policy if exists "ocorrencias_write_profiles" on public.ocorrencias;
drop policy if exists "planos_acao_read_profiles" on public.planos_acao;
drop policy if exists "planos_acao_write_profiles" on public.planos_acao;

create policy "apt_read_profiles"
on public.apt
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "apt_write_profiles"
on public.apt
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));

create policy "inspecoes_read_profiles"
on public.inspecoes
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "inspecoes_write_profiles"
on public.inspecoes
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));

create policy "ocorrencias_read_profiles"
on public.ocorrencias
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "ocorrencias_write_profiles"
on public.ocorrencias
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));

create policy "planos_acao_read_profiles"
on public.planos_acao
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','sst','supervisor','gerencia','diretoria','service_role')
);

create policy "planos_acao_write_profiles"
on public.planos_acao
for all
using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));
