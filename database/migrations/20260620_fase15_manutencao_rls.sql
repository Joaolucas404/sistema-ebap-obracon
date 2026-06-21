-- Fase 15 - RLS Manutencao
-- Leitura inclui anon por compatibilidade com autenticacao propria atual.
-- Escritas devem preferir as RPCs, que validam p_user_id em usuarios.

alter table public.manutencao_planos enable row level security;
alter table public.manutencao_execucoes enable row level security;

drop policy if exists "manutencao_planos_read_profiles" on public.manutencao_planos;
drop policy if exists "manutencao_planos_write_profiles" on public.manutencao_planos;
drop policy if exists "manutencao_execucoes_read_profiles" on public.manutencao_execucoes;
drop policy if exists "manutencao_execucoes_write_profiles" on public.manutencao_execucoes;

create policy "manutencao_planos_read_profiles"
on public.manutencao_planos
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','tecnico','supervisor','gerencia','diretoria','service_role')
);

create policy "manutencao_planos_write_profiles"
on public.manutencao_planos
for all
using (public.current_app_role() in ('supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('supervisor','gerencia','diretoria','service_role'));

create policy "manutencao_execucoes_read_profiles"
on public.manutencao_execucoes
for select
using (
  deleted_at is null
  and public.current_app_role() in ('anon','tecnico','supervisor','gerencia','diretoria','service_role')
);

create policy "manutencao_execucoes_write_profiles"
on public.manutencao_execucoes
for all
using (public.current_app_role() in ('tecnico','supervisor','gerencia','diretoria','service_role'))
with check (public.current_app_role() in ('tecnico','supervisor','gerencia','diretoria','service_role'));
