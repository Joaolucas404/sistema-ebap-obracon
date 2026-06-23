alter table public.usuarios
  add column if not exists area_supervisao text;

alter table public.ordens_servico
  add column if not exists supervisor_responsavel uuid references public.usuarios(id) on delete set null,
  add column if not exists status_supervisor text not null default 'aguardando_supervisor',
  add column if not exists equipe text,
  add column if not exists tecnico_responsavel uuid references public.usuarios(id) on delete set null,
  add column if not exists historico_roteamento jsonb not null default '[]'::jsonb;

do $$
begin
  alter table public.ordens_servico drop constraint if exists ordens_servico_status_supervisor_check;
  alter table public.ordens_servico
    add constraint ordens_servico_status_supervisor_check
    check (status_supervisor in (
      'aguardando_supervisor',
      'analise_supervisor',
      'programada',
      'encaminhada_tecnicos',
      'em_execucao',
      'validacao_supervisor',
      'devolvida_correcao',
      'concluida',
      'reencaminhada'
    ));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.supervisor_areas (
  id uuid primary key default gen_random_uuid(),
  area text not null unique,
  nome text not null,
  supervisor_id uuid references public.usuarios(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

insert into public.supervisor_areas (area, nome)
values
  ('eletrica', 'Elétrica'),
  ('mecanica', 'Mecânica'),
  ('automacao', 'Automação'),
  ('operacional', 'Operação'),
  ('limpeza', 'Limpeza'),
  ('civil', 'Civil / Estrutural'),
  ('sst', 'SST'),
  ('administrativo', 'Administrativo'),
  ('outros', 'Outros')
on conflict (area) do update set
  nome = excluded.nome,
  updated_at = now();

update public.usuarios u
   set area_supervisao = sa.area,
       updated_at = now()
  from public.supervisor_areas sa
 where u.perfil = 'supervisor'
   and u.area_supervisao is null
   and lower(coalesce(u.setor, '')) in (sa.area, lower(sa.nome));

update public.ordens_servico os
   set supervisor_responsavel = sa.supervisor_id,
       status_supervisor = case
         when os.status in ('analise_supervisor') then 'analise_supervisor'
         when os.status in ('programada') then 'programada'
         when os.status in ('encaminhada_tecnicos') then 'encaminhada_tecnicos'
         when os.status in ('em_execucao') then 'em_execucao'
         when os.status in ('concluida_tecnicos','validacao_supervisor') then 'validacao_supervisor'
         when os.status in ('nao_conforme') then 'devolvida_correcao'
         when os.status in ('concluida_arquivada','concluida','finalizada','arquivada') then 'concluida'
         else 'aguardando_supervisor'
       end,
       equipe = coalesce(os.equipe, os.equipe_responsavel),
       tecnico_responsavel = coalesce(os.tecnico_responsavel, os.responsavel_id),
       historico_roteamento = case
         when jsonb_array_length(coalesce(os.historico_roteamento, '[]'::jsonb)) = 0 then
           jsonb_build_array(jsonb_build_object(
             'acao', 'roteamento_inicial',
             'area', os.area,
             'supervisor_id', sa.supervisor_id,
             'data', now()
           ))
         else os.historico_roteamento
       end,
       updated_at = now()
  from public.supervisor_areas sa
 where os.deleted_at is null
   and os.area = sa.area
   and (os.supervisor_responsavel is null or os.historico_roteamento = '[]'::jsonb);

create index if not exists idx_usuarios_area_supervisao
  on public.usuarios(area_supervisao) where deleted_at is null;

create index if not exists idx_supervisor_areas_area
  on public.supervisor_areas(area) where deleted_at is null;

create index if not exists idx_ordens_servico_supervisao_area_status
  on public.ordens_servico(area, status_supervisor, status) where deleted_at is null;

create index if not exists idx_ordens_servico_supervisor_responsavel
  on public.ordens_servico(supervisor_responsavel, status_supervisor) where deleted_at is null;

create index if not exists idx_ordens_servico_tecnico_responsavel
  on public.ordens_servico(tecnico_responsavel, data_programada) where deleted_at is null;

alter table public.supervisor_areas enable row level security;

drop policy if exists "supervisor_areas_read" on public.supervisor_areas;
create policy "supervisor_areas_read" on public.supervisor_areas
for select using (
  deleted_at is null
  and public.current_app_role() in ('anon','supervisor','cco','gerencia','diretoria','service_role')
);

drop policy if exists "supervisor_areas_manage" on public.supervisor_areas;
create policy "supervisor_areas_manage" on public.supervisor_areas
for all using (
  public.current_app_role() in ('gerencia','diretoria','service_role')
) with check (
  public.current_app_role() in ('gerencia','diretoria','service_role')
);
