alter table public.compras enable row level security;
alter table public.compra_itens enable row level security;
alter table public.compra_historico enable row level security;
alter table public.compra_aprovacoes enable row level security;

drop policy if exists "compras_read_profiles" on public.compras;
drop policy if exists "compras_write_profiles" on public.compras;
drop policy if exists "compras_read_profiles_fase16" on public.compras;
drop policy if exists "compras_write_profiles_fase16" on public.compras;

create policy "compras_read_profiles"
on public.compras
for select
using (
  deleted_at is null
  and public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
);

create policy "compras_write_profiles"
on public.compras
for all
using (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
)
with check (true);

drop policy if exists "compra_itens_read_profiles_fase16" on public.compra_itens;
drop policy if exists "compra_itens_write_profiles_fase16" on public.compra_itens;
drop policy if exists "compra_itens_read_profiles" on public.compra_itens;
drop policy if exists "compra_itens_write_profiles" on public.compra_itens;

create policy "compra_itens_read_profiles"
on public.compra_itens
for select
using (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
);

create policy "compra_itens_write_profiles"
on public.compra_itens
for all
using (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
)
with check (true);

drop policy if exists "compra_historico_read_profiles_fase16" on public.compra_historico;
drop policy if exists "compra_historico_write_profiles_fase16" on public.compra_historico;
drop policy if exists "compra_historico_read_profiles" on public.compra_historico;
drop policy if exists "compra_historico_write_profiles" on public.compra_historico;

create policy "compra_historico_read_profiles"
on public.compra_historico
for select
using (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
);

create policy "compra_historico_write_profiles"
on public.compra_historico
for insert
with check (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
);

drop policy if exists "compra_aprovacoes_read_profiles_fase16" on public.compra_aprovacoes;
drop policy if exists "compra_aprovacoes_write_profiles_fase16" on public.compra_aprovacoes;
drop policy if exists "compra_aprovacoes_rw" on public.compra_aprovacoes;
drop policy if exists "compra_aprovacoes_read_profiles" on public.compra_aprovacoes;
drop policy if exists "compra_aprovacoes_write_profiles" on public.compra_aprovacoes;

create policy "compra_aprovacoes_read_profiles"
on public.compra_aprovacoes
for select
using (
  public.current_app_role() in (
    'almoxarifado',
    'administrativo',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'sst',
    'service_role'
  )
);

create policy "compra_aprovacoes_write_profiles"
on public.compra_aprovacoes
for all
using (
  public.current_app_role() in (
    'financeiro',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (true);
