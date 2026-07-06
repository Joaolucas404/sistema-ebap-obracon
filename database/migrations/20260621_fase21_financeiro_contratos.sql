alter table public.contratos
  add column if not exists ebap_id uuid references public.ebaps(id) on delete set null,
  add column if not exists tipo text not null default 'prestacao_servico',
  add column if not exists valor_executado numeric(14,2) not null default 0,
  add column if not exists created_by uuid references public.usuarios(id) on delete set null,
  add column if not exists aprovado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists aprovado_em timestamptz,
  add column if not exists fiscalizacao_status text not null default 'pendente',
  add column if not exists data_assinatura date;

alter table public.contratos
  drop constraint if exists contratos_tipo_chk,
  drop constraint if exists contratos_fiscalizacao_status_chk;

alter table public.contratos
  add constraint contratos_tipo_chk
  check (tipo in ('prestacao_servico','fornecimento','locacao','manutencao','obra','outro')),
  add constraint contratos_fiscalizacao_status_chk
  check (fiscalizacao_status in ('pendente','em_fiscalizacao','aprovada_prefeitura','reprovada_prefeitura','ajuste_solicitado'));

alter table public.medições
  add column if not exists numero text,
  add column if not exists ebap_id uuid references public.ebaps(id) on delete set null,
  add column if not exists percentual_execucao numeric(6,2) not null default 0,
  add column if not exists valor_glosa numeric(14,2) not null default 0,
  add column if not exists valor_liquido numeric(14,2) generated always as (greatest(coalesce(valor_aprovado, valor_medido, 0) - coalesce(valor_glosa, 0), 0)) stored,
  add column if not exists prefeitura_status text not null default 'nao_enviada',
  add column if not exists os_ids uuid[] not null default '{}',
  add column if not exists relatorio_ids uuid[] not null default '{}',
  add column if not exists aprovado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists aprovado_em timestamptz,
  add column if not exists fiscalizado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists fiscalizado_em timestamptz,
  add column if not exists created_by uuid references public.usuarios(id) on delete set null;

alter table public.medições
  drop constraint if exists medições_prefeitura_status_chk,
  drop constraint if exists medições_percentual_execucao_chk;

alter table public.medições
  add constraint medições_prefeitura_status_chk
  check (prefeitura_status in ('nao_enviada','enviada','em_fiscalizacao','aprovada','reprovada','ajuste_solicitado')),
  add constraint medições_percentual_execucao_chk
  check (percentual_execucao between 0 and 100);

alter table public.financeiro_lancamentos
  add column if not exists medicao_id uuid references public.medições(id) on delete set null,
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null,
  add column if not exists ebap_id uuid references public.ebaps(id) on delete set null,
  add column if not exists categoria text,
  add column if not exists competencia_mes integer check (competencia_mes between 1 and 12),
  add column if not exists competencia_ano integer check (competencia_ano between 2000 and 2100),
  add column if not exists data_emissao date,
  add column if not exists forma_pagamento text,
  add column if not exists aprovado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists aprovado_em timestamptz,
  add column if not exists observacoes text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.usuarios(id) on delete set null;

create table if not exists public.financeiro_documentos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('contrato','medicao','lancamento')),
  entidade_id uuid not null,
  nome text not null,
  bucket text not null default 'contract-files',
  path text not null,
  mime_type text,
  tamanho_bytes bigint,
  uploaded_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (bucket, path)
);

create table if not exists public.financeiro_historico (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('contrato','medicao','lancamento','documento')),
  entidade_id uuid not null,
  usuario_id uuid references public.usuarios(id) on delete set null,
  acao text not null,
  status_anterior text,
  status_novo text,
  descricao text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_contratos_ebap on public.contratos(ebap_id) where deleted_at is null;
create index if not exists idx_contratos_fornecedor_status on public.contratos(fornecedor_id, status) where deleted_at is null;
create index if not exists idx_medições_contrato_status on public.medições(contrato_id, status) where deleted_at is null;
create index if not exists idx_medições_prefeitura_status on public.medições(prefeitura_status) where deleted_at is null;
create index if not exists idx_financeiro_lancamentos_contrato on public.financeiro_lancamentos(contrato_id) where deleted_at is null;
create index if not exists idx_financeiro_lancamentos_medicao on public.financeiro_lancamentos(medicao_id) where deleted_at is null;
create index if not exists idx_financeiro_documentos_entidade on public.financeiro_documentos(entidade_tipo, entidade_id) where deleted_at is null;
create index if not exists idx_financeiro_historico_entidade on public.financeiro_historico(entidade_tipo, entidade_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-files',
  'contract-files',
  false,
  52428800,
  array['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['contratos','medições','financeiro_lancamentos']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', tbl);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl);
  end loop;
end $$;
