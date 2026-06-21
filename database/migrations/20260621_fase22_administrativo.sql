create table if not exists public.adm_colaboradores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete set null,
  sst_colaborador_id uuid references public.sst_colaboradores(id) on delete set null,
  matricula text unique,
  nome text not null,
  cpf text,
  cargo text,
  setor text,
  tipo_contrato text not null default 'clt',
  admissao_em date,
  desligamento_em date,
  salario_base numeric(14,2),
  status text not null default 'ativo',
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_colaboradores_status_chk check (status in ('ativo','ferias','afastado','desligado','experiencia')),
  constraint adm_colaboradores_tipo_contrato_chk check (tipo_contrato in ('clt','pj','temporario','estagio','terceirizado','outro'))
);

create table if not exists public.adm_ferias (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.adm_colaboradores(id) on delete cascade,
  periodo_aquisitivo_inicio date not null,
  periodo_aquisitivo_fim date not null,
  inicio date not null,
  fim date not null,
  dias integer not null check (dias > 0),
  abono boolean not null default false,
  status text not null default 'programada',
  aprovado_por uuid references public.usuarios(id) on delete set null,
  aprovado_em timestamptz,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_ferias_status_chk check (status in ('programada','em_andamento','concluida','cancelada','pendente_aprovacao')),
  constraint adm_ferias_periodo_chk check (fim >= inicio and periodo_aquisitivo_fim >= periodo_aquisitivo_inicio)
);

create table if not exists public.adm_atestados (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.adm_colaboradores(id) on delete cascade,
  tipo text not null default 'medico',
  inicio date not null,
  fim date not null,
  dias integer not null check (dias > 0),
  cid text,
  medico text,
  status text not null default 'registrado',
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_atestados_tipo_chk check (tipo in ('medico','odontologico','acidente_trabalho','comparecimento','outro')),
  constraint adm_atestados_status_chk check (status in ('registrado','validado','rejeitado','arquivado')),
  constraint adm_atestados_periodo_chk check (fim >= inicio)
);

create table if not exists public.adm_documentos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('colaborador','ferias','atestado','veiculo','manutencao_frota','geral')),
  entidade_id uuid,
  tipo text not null,
  nome text not null,
  validade date,
  status text not null default 'vigente',
  bucket text not null default 'admin-files',
  path text,
  mime_type text,
  tamanho_bytes bigint,
  uploaded_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_documentos_status_chk check (status in ('vigente','vencendo','vencido','arquivado')),
  unique (bucket, path)
);

create table if not exists public.adm_veiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  prefixo text,
  modelo text not null,
  marca text,
  ano integer,
  tipo text not null default 'leve',
  status text not null default 'operacional',
  km_atual integer not null default 0,
  renavam text,
  seguro_validade date,
  licenciamento_validade date,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_veiculos_status_chk check (status in ('operacional','manutencao','indisponivel','baixado')),
  constraint adm_veiculos_tipo_chk check (tipo in ('leve','utilitario','caminhao','moto','equipamento','outro'))
);

create table if not exists public.adm_frota_manutencoes (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.adm_veiculos(id) on delete cascade,
  manutencao_id uuid references public.manutencao_execucoes(id) on delete set null,
  tipo text not null default 'preventiva',
  descricao text not null,
  km_execucao integer,
  data_programada date,
  data_execucao date,
  custo numeric(14,2) not null default 0,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  status text not null default 'programada',
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint adm_frota_manutencoes_tipo_chk check (tipo in ('preventiva','corretiva','preditiva','documental','sinistro')),
  constraint adm_frota_manutencoes_status_chk check (status in ('programada','em_execucao','concluida','atrasada','cancelada'))
);

create table if not exists public.adm_historico (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null,
  entidade_id uuid,
  usuario_id uuid references public.usuarios(id) on delete set null,
  acao text not null,
  descricao text,
  status_anterior text,
  status_novo text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_adm_colaboradores_status on public.adm_colaboradores(status) where deleted_at is null;
create index if not exists idx_adm_colaboradores_usuario on public.adm_colaboradores(usuario_id) where deleted_at is null;
create index if not exists idx_adm_ferias_colaborador_status on public.adm_ferias(colaborador_id, status) where deleted_at is null;
create index if not exists idx_adm_ferias_inicio on public.adm_ferias(inicio) where deleted_at is null;
create index if not exists idx_adm_atestados_colaborador on public.adm_atestados(colaborador_id, inicio desc) where deleted_at is null;
create index if not exists idx_adm_documentos_validade on public.adm_documentos(validade, status) where deleted_at is null;
create index if not exists idx_adm_documentos_entidade on public.adm_documentos(entidade_tipo, entidade_id) where deleted_at is null;
create index if not exists idx_adm_veiculos_status on public.adm_veiculos(status) where deleted_at is null;
create index if not exists idx_adm_frota_manutencoes_veiculo on public.adm_frota_manutencoes(veiculo_id, status) where deleted_at is null;
create index if not exists idx_adm_historico_entidade on public.adm_historico(entidade_tipo, entidade_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'admin-files',
  'admin-files',
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
  foreach tbl in array array['adm_colaboradores','adm_ferias','adm_atestados','adm_documentos','adm_veiculos','adm_frota_manutencoes']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', tbl);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl);
  end loop;
end $$;
