create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.perfis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  nivel_acesso integer not null default 1 check (nivel_acesso between 1 and 100),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  modulo text not null,
  rota text,
  acao text not null default 'read',
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfil_permissoes (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  permissao_id uuid not null references public.permissoes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (perfil_id, permissao_id)
);

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,
  senha_hash text not null,
  nome text not null,
  perfil text not null,
  perfil_id uuid references public.perfis(id) on delete set null,
  setor text,
  area_operacional text,
  area_supervisão text,
  cargo text,
  telefone text,
  ativo boolean not null default true,
  ultimo_login timestamptz,
  criado_por uuid references public.usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint usuarios_perfil_lower_chk check (perfil = lower(perfil)),
  constraint usuarios_usuario_trim_chk check (usuario = btrim(usuario)),
  constraint usuarios_area_operacional_check check (
    area_operacional is null
    or area_operacional in ('todas','mecanica','eletrica','automacao','operacional','sst','administrativo','almoxarifado','financeiro','cco','diretoria','gerencia','prefeitura')
  )
);

create table public.ebaps (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nome text not null unique,
  nome_curto text,
  status text not null default 'normal' check (status in ('normal','atencao','critico','inativo')),
  endereco text,
  bairro text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  observacoes text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table public.supervisor_areas (
  id uuid primary key default gen_random_uuid(),
  area text not null unique,
  nome text not null,
  supervisor_id uuid references public.usuarios(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.equipamento_tipos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  area text,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  ebap_id uuid not null references public.ebaps(id) on delete restrict,
  tipo_id uuid references public.equipamento_tipos(id) on delete set null,
  codigo text,
  tag text,
  nome text not null,
  fabricante text,
  modelo text,
  numero_serie text,
  area_responsavel text,
  criticidade text not null default 'media' check (criticidade in ('baixa','media','alta','critica')),
  status_operacional text not null default 'operando' check (status_operacional in ('operando','parado','falha','manutencao','inativo','nao_aplicavel')),
  instalado_em date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (ebap_id, tag)
);

create table public.relatorios_diarios (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  ebap_id uuid references public.ebaps(id) on delete set null,
  operador_id uuid references public.usuarios(id) on delete set null,
  data_operacao date not null,
  inicio_em timestamptz,
  finalizado_em timestamptz,
  status text not null default 'rascunho' check (status in ('rascunho','pendente_validacao_cco','validado_cco','rejeitado_cco','correcao_solicitada','enviado_cco','devolvido_cco','arquivado','cancelado')),
  prioridade text default 'normal' check (prioridade in ('baixa','normal','alta','critica')),
  resumo text,
  ocorrencias text,
  conclusao_operador text,
  hash_conferencia text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table public.relatorio_diario_secoes (
  id uuid primary key default gen_random_uuid(),
  relatorio_id uuid not null references public.relatorios_diarios(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  ordem integer not null default 0,
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida','nao_aplicavel')),
  dados jsonb not null default '{}'::jsonb,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relatorio_id, codigo)
);

create table public.relatorio_diario_itens (
  id uuid primary key default gen_random_uuid(),
  relatorio_id uuid not null references public.relatorios_diarios(id) on delete cascade,
  secao_id uuid references public.relatorio_diario_secoes(id) on delete cascade,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  tipo_item text not null,
  descricao text not null,
  status text,
  valor_texto text,
  valor_numero numeric,
  unidade text,
  observacao text,
  solicitar_os boolean not null default false,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.validacoes_cco (
  id uuid primary key default gen_random_uuid(),
  relatorio_id uuid references public.relatorios_diarios(id) on delete cascade,
  os_id uuid,
  operador_cco_id uuid references public.usuarios(id) on delete set null,
  status text not null check (status in ('pendente','validado','validado_com_restricao','nao_validado','devolvido','aguardando_correcao')),
  comunicacao_status text,
  protocolo text,
  motivo_devolucao text,
  observacoes text,
  assinatura_digital text,
  validado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint validacoes_cco_alvo_chk check (relatorio_id is not null or os_id is not null)
);

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  origem text not null default 'operacao' check (origem in ('operacao','prefeitura','manutencao','sst','almoxarifado','administrativo')),
  relatorio_id uuid references public.relatorios_diarios(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  modelo_relatorio_id uuid,
  tipo_manutencao text,
  solicitante_id uuid references public.usuarios(id) on delete set null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  titulo text not null,
  descricao text not null,
  area text,
  prioridade text not null default 'media' check (prioridade in ('baixa','media','alta','urgente','critica')),
  status text not null default 'solicitada_prefeitura' check (status in ('solicitada_prefeitura','aguardando_supervisor','analise_supervisor','programada','encaminhada_tecnicos','em_execucao','concluida_tecnicos','validacao_supervisor','enviada_prefeitura','aguardando_validacao_prefeitura','nao_conforme','concluida_arquivada','aberta','em_analise','enviada_cco','validada_cco','devolvida_cco','aguardando_material','execucao_concluida','aguardando_prefeitura','concluida','finalizada','arquivada','rejeitada','cancelada')),
  supervisor_responsavel uuid references public.usuarios(id) on delete set null,
  status_supervisor text not null default 'aguardando_supervisor' check (status_supervisor in ('aguardando_supervisor','analise_supervisor','programada','encaminhada_tecnicos','em_execucao','validacao_supervisor','devolvida_correcao','concluida','reencaminhada')),
  equipe_responsavel text,
  equipe text,
  tecnico_responsavel uuid references public.usuarios(id) on delete set null,
  data_programada date,
  hora_programada time,
  turno text,
  inicio_execucao timestamptz,
  fim_execucao timestamptz,
  relatorio_tecnico text,
  materiais_utilizados text,
  pendencias text,
  motivo_cancelamento text,
  payload jsonb not null default '{}'::jsonb,
  historico_roteamento jsonb not null default '[]'::jsonb,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

alter table public.validacoes_cco
  add constraint validacoes_cco_os_fk foreign key (os_id) references public.ordens_servico(id) on delete cascade;

create table public.os_historico (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  acao text not null,
  status_anterior text,
  status_novo text,
  descricao text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.modelos_relatorio (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  equipamento_tipo text not null,
  tipo_manutencao text not null check (tipo_manutencao in ('corretiva','preventiva','preditiva')),
  area text,
  source_html text,
  resumo text,
  versao integer not null default 1,
  ativo boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.campos_relatorio (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references public.modelos_relatorio(id) on delete cascade,
  chave text not null,
  label text not null,
  tipo text not null check (tipo in ('texto','numero','textarea','select','checklist','foto','assinatura')),
  grupo text not null default 'dados',
  obrigatorio boolean not null default false,
  ordem integer not null default 0,
  opcoes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (modelo_id, chave)
);

create table public.respostas_relatorio (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  modelo_id uuid not null references public.modelos_relatorio(id) on delete restrict,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  ativo_nome text,
  tipo_manutencao text not null check (tipo_manutencao in ('corretiva','preventiva','preditiva')),
  status text not null default 'rascunho' check (status in ('rascunho','enviado_supervisor','aprovado_supervisor','nao_conforme','cancelado')),
  respostas jsonb not null default '{}'::jsonb,
  fotos_obrigatorias jsonb not null default '[]'::jsonb,
  observacoes text,
  enviado_por uuid references public.usuarios(id) on delete set null,
  enviado_em timestamptz,
  validado_por uuid references public.usuarios(id) on delete set null,
  validado_em timestamptz,
  motivo_nao_conformidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (os_id, modelo_id)
);

alter table public.ordens_servico
  add constraint ordens_servico_modelo_relatorio_id_fkey
  foreign key (modelo_relatorio_id) references public.modelos_relatorio(id) on delete set null;

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('relatorio_diario','ordem_servico','compra','contrato','medicao','sst','almoxarifado')),
  entidade_id uuid not null,
  usuario_id uuid references public.usuarios(id) on delete set null,
  comentario text not null,
  interno boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('relatorio_diario','ordem_servico','compra','contrato','medicao','sst','almoxarifado','usuario')),
  entidade_id uuid not null,
  bucket text not null,
  path text not null,
  nome_original text not null,
  mime_type text,
  tamanho_bytes bigint check (tamanho_bytes is null or tamanho_bytes >= 0),
  legenda text,
  categoria text,
  hash_arquivo text,
  uploaded_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (bucket, path)
);

create table public.arquivo_pdf (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo text not null check (entidade_tipo in ('relatorio_diario','ordem_servico','medicao','sst','compra','contrato')),
  entidade_id uuid not null,
  codigo text not null unique,
  titulo text not null,
  bucket text not null default 'pdf-archive',
  path text not null,
  hash_conferencia text,
  status text not null default 'ativo' check (status in ('ativo','substituido','cancelado')),
  data_documento date,
  mes integer check (mes is null or mes between 1 and 12),
  ano integer check (ano is null or ano between 2000 and 2100),
  gerado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (bucket, path)
);

create table public.archive_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('relatorio_diario','ordem_servico','medicao','sst','compra','contrato')),
  entity_id uuid not null,
  document_number text not null unique,
  title text not null,
  bucket text not null default 'pdf-archive',
  path text not null,
  generated_by uuid references public.usuarios(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (bucket, path)
);

create table public.almoxarifado_locais (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.almoxarifado_itens (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  categoria text not null,
  unidade text not null default 'un',
  local_id uuid references public.almoxarifado_locais(id) on delete set null,
  estoque_atual numeric(14,3) not null default 0,
  estoque_minimo numeric(14,3) not null default 0,
  custo_medio numeric(14,2),
  controlado boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint estoque_nao_negativo_chk check (estoque_atual >= 0 and estoque_minimo >= 0)
);

create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.almoxarifado_itens(id) on delete restrict,
  tipo text not null check (tipo in ('entrada','saida','ajuste','emprestimo','devolucao','transferencia')),
  quantidade numeric(14,3) not null check (quantidade > 0),
  saldo_anterior numeric(14,3),
  saldo_posterior numeric(14,3),
  origem text,
  destino text,
  os_id uuid references public.ordens_servico(id) on delete set null,
  solicitante_id uuid references public.usuarios(id) on delete set null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  observacao text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  solicitante_id uuid references public.usuarios(id) on delete set null,
  centro_custo text,
  tipo_material text,
  item_descricao text not null,
  quantidade numeric(14,3) not null default 1 check (quantidade > 0),
  valor_estimado numeric(14,2),
  prioridade text not null default 'normal' check (prioridade in ('normal','alta','urgente','critica')),
  prazo_necessario date,
  ebap_id uuid references public.ebaps(id) on delete set null,
  justificativa text,
  status text not null default 'rascunho' check (status in ('rascunho','enviada','gerencia_1','gerencia_2','financeiro','liberada','comprada','recebida','reprovada','cancelada')),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table public.compra_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  etapa text not null check (etapa in ('gerencia_1','gerencia_2','financeiro')),
  aprovador_id uuid references public.usuarios(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente','aprovado','devolvido','reprovado','liberado')),
  parecer text,
  aprovado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (compra_id, etapa)
);

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  email text,
  telefone text,
  contato text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  objeto text not null,
  valor_total numeric(14,2),
  data_inicio date,
  data_fim date,
  status text not null default 'ativo' check (status in ('rascunho','ativo','suspenso','encerrado','cancelado')),
  gestor_id uuid references public.usuarios(id) on delete set null,
  fiscal_id uuid references public.usuarios(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  constraint contrato_periodo_chk check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

create table public.financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references public.contratos(id) on delete set null,
  compra_id uuid references public.compras(id) on delete set null,
  tipo text not null check (tipo in ('custo','pagamento','previsão','glosa','reembolso')),
  descricao text not null,
  valor numeric(14,2) not null,
  vencimento date,
  pago_em date,
  status text not null default 'pendente' check (status in ('pendente','aprovado','pago','cancelado','atrasado')),
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medições (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references public.contratos(id) on delete set null,
  codigo text not null unique,
  competencia_mes integer not null check (competencia_mes between 1 and 12),
  competencia_ano integer not null check (competencia_ano between 2000 and 2100),
  data_inicio date,
  data_fim date,
  valor_medido numeric(14,2) not null default 0,
  valor_aprovado numeric(14,2),
  status text not null default 'rascunho' check (status in ('rascunho','enviada','em_analise','aprovada','glosada','paga','cancelada')),
  resumo text,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table public.sst_colaboradores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete set null,
  matricula text unique,
  nome text not null,
  funcao text,
  setor text,
  admissao_em date,
  status text not null default 'ativo' check (status in ('ativo','afastado','desligado','ferias')),
  aso_validade date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.sst_apr (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null default 'apr' check (tipo in ('apr','apt')),
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  atividade text not null,
  riscos text,
  medidas_controle text,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho','em_analise','liberada','reprovada','encerrada','cancelada')),
  inicio_previsto timestamptz,
  fim_previsto timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.sst_epi (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nome text not null,
  ca text,
  validade_ca date,
  categoria text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sst_epi_entregas (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.sst_colaboradores(id) on delete restrict,
  epi_id uuid not null references public.sst_epi(id) on delete restrict,
  entregue_por uuid references public.usuarios(id) on delete set null,
  quantidade integer not null default 1 check (quantidade > 0),
  entregue_em date not null default current_date,
  validade_uso date,
  assinatura_path text,
  observacoes text,
  devolvido_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sst_treinamentos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nome text not null,
  norma text,
  carga_horaria numeric(6,2),
  validade_meses integer,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sst_treinamento_colaboradores (
  id uuid primary key default gen_random_uuid(),
  treinamento_id uuid not null references public.sst_treinamentos(id) on delete restrict,
  colaborador_id uuid not null references public.sst_colaboradores(id) on delete cascade,
  realizado_em date,
  valido_ate date,
  certificado_bucket text,
  certificado_path text,
  status text not null default 'pendente' check (status in ('pendente','valido','vencendo','vencido','dispensado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (treinamento_id, colaborador_id, realizado_em)
);

create table public.sst_inspecoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  os_id uuid references public.ordens_servico(id) on delete set null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  data_inspecao date not null default current_date,
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','nao_conforme','cancelada')),
  resultado text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.sst_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  colaborador_id uuid references public.sst_colaboradores(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  tipo text not null check (tipo in ('incidente','acidente','quase_acidente','nao_conformidade','observacao')),
  gravidade text not null default 'baixa' check (gravidade in ('baixa','media','alta','critica')),
  descricao text not null,
  acao_imediata text,
  status text not null default 'aberta' check (status in ('aberta','em_tratamento','concluida','cancelada')),
  ocorrido_em timestamptz,
  registrado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.sst_planos_acao (
  id uuid primary key default gen_random_uuid(),
  origem_tipo text not null check (origem_tipo in ('inspecao','ocorrencia','apr','treinamento','outro')),
  origem_id uuid,
  descricao text not null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  prazo date,
  status text not null default 'aberto' check (status in ('aberto','em_andamento','concluido','atrasado','cancelado')),
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade,
  perfil_destino text,
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'info' check (tipo in ('info','sucesso','alerta','erro')),
  entidade_tipo text,
  entidade_id uuid,
  lida_em timestamptz,
  created_at timestamptz not null default now()
);

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete set null,
  tabela text not null,
  registro_id uuid,
  acao text not null check (acao in ('insert','update','delete','soft_delete','login','logout','download','upload','approve','reject')),
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'perfis','permissoes','usuarios','ebaps','equipamento_tipos','equipamentos',
    'relatorios_diarios','relatorio_diario_secoes','relatorio_diario_itens',
    'validacoes_cco','ordens_servico','comentarios','arquivo_pdf',
    'almoxarifado_locais','almoxarifado_itens','compras','compra_aprovacoes',
    'fornecedores','contratos','financeiro_lancamentos','medições',
    'sst_colaboradores','sst_apr','sst_epi','sst_epi_entregas',
    'sst_treinamentos','sst_treinamento_colaboradores','sst_inspecoes',
    'sst_ocorrencias','sst_planos_acao'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', tbl);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl);
  end loop;
end $$;
