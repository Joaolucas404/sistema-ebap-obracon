alter table public.ebaps enable row level security;

drop policy if exists "ebaps_localizacao_read_fase20" on public.ebaps;
drop policy if exists "ebaps_localizacao_write_fase20" on public.ebaps;

create policy "ebaps_localizacao_read_fase20"
on public.ebaps
for select
using (
  deleted_at is null
  and coalesce(ativo, ativa, true) = true
  and public.current_app_role() in (
    'operador','tecnico','cco','supervisor','gerencia','diretoria','prefeitura',
    'sst','administrativo','almoxarifado','financeiro','service_role'
  )
);

create policy "ebaps_localizacao_write_fase20"
on public.ebaps
for all
using (public.current_app_role() in ('gerencia','diretoria','administrativo','service_role'))
with check (true);
