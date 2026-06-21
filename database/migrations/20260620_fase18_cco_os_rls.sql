alter table public.validacoes_cco enable row level security;

drop policy if exists "validacoes_cco_os_read_fase18" on public.validacoes_cco;
drop policy if exists "validacoes_cco_os_write_fase18" on public.validacoes_cco;

create policy "validacoes_cco_os_read_fase18"
on public.validacoes_cco
for select
using (
  os_id is not null
  and public.current_app_role() in ('cco','supervisor','gerencia','diretoria','service_role')
);

create policy "validacoes_cco_os_write_fase18"
on public.validacoes_cco
for insert
with check (
  os_id is not null
  and public.current_app_role() in ('cco','gerencia','diretoria','service_role')
);
