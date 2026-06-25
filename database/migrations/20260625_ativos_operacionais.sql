-- Fase de reestruturacao operacional: Ativos, historico de status e vinculo com OS/RDO.

create table if not exists public.ativos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nome_operacional text not null,
  tipo text not null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  area_responsavel text,
  status_operacional text not null default 'operando',
  fabricante text,
  modelo text,
  numero_serie text,
  instalado_em date,
  observacoes text,
  metadata jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint ativos_status_operacional_check check (
    status_operacional in ('operando','operando_restricao','em_manutencao','fora_operacao')
  )
);

create table if not exists public.ativo_status_historico (
  id uuid primary key default gen_random_uuid(),
  ativo_id uuid not null references public.ativos(id) on delete cascade,
  os_id uuid references public.ordens_servico(id) on delete set null,
  status_anterior text,
  status_novo text not null,
  motivo text not null,
  usuario_id uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint ativo_status_historico_status_check check (
    status_novo in ('operando','operando_restricao','em_manutencao','fora_operacao')
  )
);

alter table public.ordens_servico
  add column if not exists ativo_id uuid references public.ativos(id) on delete set null,
  add column if not exists tipo_manutencao text;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'ordens_servico_tipo_manutencao_check'
       and conrelid = 'public.ordens_servico'::regclass
  ) then
    alter table public.ordens_servico
      add constraint ordens_servico_tipo_manutencao_check
      check (tipo_manutencao is null or tipo_manutencao in ('corretiva','preventiva','preditiva'));
  end if;
end $$;

do $$
begin
  if to_regclass('public.respostas_relatorio') is not null then
    alter table public.respostas_relatorio
      add column if not exists ativo_id uuid references public.ativos(id) on delete set null;
  end if;
end $$;

create index if not exists idx_ativos_ebap_status on public.ativos(ebap_id, status_operacional) where deleted_at is null;
create index if not exists idx_ativos_tipo on public.ativos(tipo) where deleted_at is null;
create index if not exists idx_ativos_area on public.ativos(area_responsavel) where deleted_at is null;
create index if not exists idx_ativo_status_historico_ativo on public.ativo_status_historico(ativo_id, created_at desc);
create index if not exists idx_ordens_servico_ativo on public.ordens_servico(ativo_id) where deleted_at is null;
create index if not exists idx_ordens_servico_tipo_manutencao on public.ordens_servico(tipo_manutencao) where deleted_at is null;

alter table public.ativos enable row level security;
alter table public.ativo_status_historico enable row level security;

drop policy if exists "ativos_read_operational" on public.ativos;
create policy "ativos_read_operational" on public.ativos
  for select using (deleted_at is null and public.can_read_operational());

drop policy if exists "ativos_write_managers" on public.ativos;
create policy "ativos_write_managers" on public.ativos
  for all using (public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role'))
  with check (true);

drop policy if exists "ativo_status_historico_read" on public.ativo_status_historico;
create policy "ativo_status_historico_read" on public.ativo_status_historico
  for select using (public.can_read_operational());

drop policy if exists "ativo_status_historico_write" on public.ativo_status_historico;
create policy "ativo_status_historico_write" on public.ativo_status_historico
  for insert with check (public.current_app_role() in ('anon','supervisor','gerencia','diretoria','administrador','service_role'));

with ebap_base as (
  select id, nome
    from public.ebaps
   where coalesce(ativo, true) = true
     and deleted_at is null
),
bombas as (
  select id as ebap_id, nome as ebap_nome, gs as seq, 'Bomba'::text as tipo, 'mecanica'::text as area_responsavel
    from ebap_base cross join generate_series(1, 8) gs
),
geradores as (
  select id as ebap_id, nome as ebap_nome, gs as seq, 'Gerador'::text as tipo, 'eletrica'::text as area_responsavel
    from ebap_base cross join generate_series(1, 1) gs
),
laranja_comportas as (
  select id as ebap_id, nome as ebap_nome, gs as seq, 'Comporta'::text as tipo, 'operacional'::text as area_responsavel
    from ebap_base cross join generate_series(1, 10) gs
   where lower(nome) like '%laranja%'
),
laranja_rastelos as (
  select id as ebap_id, nome as ebap_nome, gs as seq, 'Rastelo'::text as tipo, 'mecanica'::text as area_responsavel
    from ebap_base cross join generate_series(1, 10) gs
   where lower(nome) like '%laranja%'
),
ativos_seed as (
  select * from bombas
  union all select * from geradores
  union all select * from laranja_comportas
  union all select * from laranja_rastelos
)
insert into public.ativos (
  codigo,
  nome_operacional,
  tipo,
  ebap_id,
  area_responsavel,
  status_operacional,
  observacoes,
  metadata
)
select
  concat(ebap_id::text, '-', lower(tipo), '-', lpad(seq::text, 2, '0')) as codigo,
  concat(tipo, ' ', lpad(seq::text, 2, '0'), ' - ', ebap_nome) as nome_operacional,
  tipo,
  ebap_id,
  area_responsavel,
  'operando',
  'Carga inicial baseada na biblioteca operacional de relatorios tecnicos.',
  jsonb_build_object('origem', 'fase_reestruturacao_operacional', 'seq', seq)
from ativos_seed
on conflict (codigo) do nothing;
