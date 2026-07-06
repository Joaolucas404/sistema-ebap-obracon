create extension if not exists pgcrypto;

create table if not exists public.cronograma_manutencao (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid null,
  area text not null check (area in ('mecanica', 'eletrica', 'automacao')),
  equipe text null,
  categoria text null,
  ebap text null,
  equipamento text null,
  atividade text not null,
  descricao text null,
  data_programada date not null,
  hora_programada time null,
  status text not null default 'programada' check (status in ('programada', 'os_gerada', 'em_execucao', 'concluida', 'atrasada', 'reprogramada', 'cancelada')),
  tipo_evento text not null default 'manutencao',
  origem text not null default 'manual',
  arquivo_importado text null,
  aba_origem text null,
  linha_origem integer null,
  os_id uuid null references public.ordens_servico(id) on delete set null,
  importacao_id uuid null,
  criado_por uuid null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deleted_at timestamptz null
);

create table if not exists public.cronograma_manutencao_importacoes (
  id uuid primary key default gen_random_uuid(),
  arquivo text not null,
  mes_referencia text null,
  abas_importadas text[] not null default '{}',
  total_eventos integer not null default 0,
  area text null,
  usuario_id uuid null,
  modo text not null default 'mesclar',
  resumo jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  deleted_at timestamptz null
);

create table if not exists public.manutencao_classificacao_atividade (
  id uuid primary key default gen_random_uuid(),
  atividade_normalizada text not null unique,
  atividade_exemplo text not null,
  area text not null check (area in ('mecanica', 'eletrica', 'automacao')),
  criado_por uuid null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_cronograma_manutencao_data on public.cronograma_manutencao(data_programada);
create index if not exists idx_cronograma_manutencao_area on public.cronograma_manutencao(area);
create index if not exists idx_cronograma_manutencao_status on public.cronograma_manutencao(status);
create index if not exists idx_cronograma_manutencao_importacao on public.cronograma_manutencao(importacao_id);

create or replace function public.touch_cronograma_manutencao()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_cronograma_manutencao on public.cronograma_manutencao;
create trigger trg_touch_cronograma_manutencao
before update on public.cronograma_manutencao
for each row execute function public.touch_cronograma_manutencao();
