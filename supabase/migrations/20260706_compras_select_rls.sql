alter table public.compras enable row level security;
alter table public.compra_itens enable row level security;
alter table public.compra_aprovacoes enable row level security;
alter table public.compra_historico enable row level security;

drop policy if exists "compras_select_operacional_20260706" on public.compras;
drop policy if exists "compra_itens_select_operacional_20260706" on public.compra_itens;
drop policy if exists "compra_aprovacoes_select_operacional_20260706" on public.compra_aprovacoes;
drop policy if exists "compra_historico_select_operacional_20260706" on public.compra_historico;

create policy "compras_select_operacional_20260706"
on public.compras
for select
using (
  deleted_at is null
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'almoxarifado',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "compra_itens_select_operacional_20260706"
on public.compra_itens
for select
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'almoxarifado',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "compra_aprovacoes_select_operacional_20260706"
on public.compra_aprovacoes
for select
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'almoxarifado',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "compra_historico_select_operacional_20260706"
on public.compra_historico
for select
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'almoxarifado',
    'financeiro',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);
