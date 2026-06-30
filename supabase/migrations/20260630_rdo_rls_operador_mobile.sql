alter table public.relatorios_diarios enable row level security;
alter table public.relatorio_diario_secoes enable row level security;
alter table public.relatorio_diario_itens enable row level security;
alter table public.anexos enable row level security;

drop policy if exists "rdo_relatorios_select_operacional_20260630" on public.relatorios_diarios;
drop policy if exists "rdo_relatorios_insert_operador_20260630" on public.relatorios_diarios;
drop policy if exists "rdo_relatorios_update_operador_20260630" on public.relatorios_diarios;
drop policy if exists "rdo_secoes_rw_operador_20260630" on public.relatorio_diario_secoes;
drop policy if exists "rdo_itens_rw_operador_20260630" on public.relatorio_diario_itens;
drop policy if exists "rdo_anexos_rw_operador_20260630" on public.anexos;

create policy "rdo_relatorios_select_operacional_20260630"
on public.relatorios_diarios
for select
using (
  deleted_at is null
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_relatorios_insert_operador_20260630"
on public.relatorios_diarios
for insert
with check (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_relatorios_update_operador_20260630"
on public.relatorios_diarios
for update
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_secoes_rw_operador_20260630"
on public.relatorio_diario_secoes
for all
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_itens_rw_operador_20260630"
on public.relatorio_diario_itens
for all
using (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (
  public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_anexos_rw_operador_20260630"
on public.anexos
for all
using (
  entidade_tipo = 'relatorio_diario'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (
  entidade_tipo = 'relatorio_diario'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

drop policy if exists "rdo_report_photos_read_20260630" on storage.objects;
drop policy if exists "rdo_report_photos_insert_20260630" on storage.objects;
drop policy if exists "rdo_report_photos_update_20260630" on storage.objects;
drop policy if exists "rdo_report_photos_delete_20260630" on storage.objects;

create policy "rdo_report_photos_read_20260630"
on storage.objects
for select
using (
  bucket_id = 'report-photos'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'cco',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_report_photos_insert_20260630"
on storage.objects
for insert
with check (
  bucket_id = 'report-photos'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_report_photos_update_20260630"
on storage.objects
for update
using (
  bucket_id = 'report-photos'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
)
with check (
  bucket_id = 'report-photos'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);

create policy "rdo_report_photos_delete_20260630"
on storage.objects
for delete
using (
  bucket_id = 'report-photos'
  and public.current_app_role() in (
    'anon',
    'authenticated',
    'operador',
    'supervisor',
    'gerencia',
    'diretoria',
    'service_role'
  )
);
