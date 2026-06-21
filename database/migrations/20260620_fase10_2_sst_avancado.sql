-- Fase 10.2 - SST Avancado
-- APT, Inspecoes, Ocorrencias e Plano de Acao integrados a OS.

create table if not exists public.apt (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  apr_id uuid references public.apr(id) on delete set null,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  atividade text not null,
  local_atividade text,
  equipe text,
  riscos text,
  medidas_controle text,
  epis_obrigatorios text,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  autorizador_id uuid references public.usuarios(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho','em_analise','liberada','reprovada','encerrada','cancelada')),
  inicio_previsto timestamptz,
  fim_previsto timestamptz,
  liberada_em timestamptz,
  encerrada_em timestamptz,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.inspecoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  apr_id uuid references public.apr(id) on delete set null,
  apt_id uuid references public.apt(id) on delete set null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  data_inspecao date not null default current_date,
  status text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','nao_conforme','cancelada')),
  resultado text,
  nao_conformidades text,
  recomendacoes text,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  apr_id uuid references public.apr(id) on delete set null,
  apt_id uuid references public.apt(id) on delete set null,
  inspecao_id uuid references public.inspecoes(id) on delete set null,
  tipo text not null check (tipo in ('incidente','acidente','quase_acidente','nao_conformidade','observacao')),
  gravidade text not null default 'baixa' check (gravidade in ('baixa','media','alta','critica')),
  descricao text not null,
  acao_imediata text,
  envolvido_id uuid references public.usuarios(id) on delete set null,
  registrado_por uuid references public.usuarios(id) on delete set null,
  ocorrido_em timestamptz,
  status text not null default 'aberta' check (status in ('aberta','em_tratamento','concluida','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.planos_acao (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  origem_tipo text not null check (origem_tipo in ('inspecao','ocorrencia','apr','apt','os','outro')),
  origem_id uuid,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  descricao text not null,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  prioridade text not null default 'media' check (prioridade in ('baixa','media','alta','critica')),
  prazo date,
  status text not null default 'aberto' check (status in ('aberto','em_andamento','concluido','atrasado','cancelado')),
  concluido_em timestamptz,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create index if not exists idx_apt_status on public.apt(status) where deleted_at is null;
create index if not exists idx_apt_os on public.apt(os_id) where deleted_at is null;
create index if not exists idx_inspecoes_status on public.inspecoes(status) where deleted_at is null;
create index if not exists idx_inspecoes_os on public.inspecoes(os_id) where deleted_at is null;
create index if not exists idx_ocorrencias_status on public.ocorrencias(status) where deleted_at is null;
create index if not exists idx_ocorrencias_gravidade on public.ocorrencias(gravidade) where deleted_at is null;
create index if not exists idx_ocorrencias_os on public.ocorrencias(os_id) where deleted_at is null;
create index if not exists idx_planos_acao_status on public.planos_acao(status, prazo) where deleted_at is null;
create index if not exists idx_planos_acao_os on public.planos_acao(os_id) where deleted_at is null;

create or replace function public.sst_salvar_apt(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_apr_id uuid,
  p_os_id uuid,
  p_ebap_id uuid,
  p_atividade text,
  p_local_atividade text,
  p_equipe text,
  p_riscos text,
  p_medidas_controle text,
  p_epis_obrigatorios text,
  p_responsavel_id uuid,
  p_autorizador_id uuid,
  p_status text,
  p_inicio_previsto timestamptz,
  p_fim_previsto timestamptz,
  p_observacoes text
)
returns public.apt
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt public.apt;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar APT.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo da APT e obrigatorio.';
  end if;

  if length(trim(coalesce(p_atividade, ''))) < 5 then
    raise exception 'Atividade da APT deve possuir pelo menos 5 caracteres.';
  end if;

  if p_id is null then
    insert into public.apt (
      codigo, apr_id, os_id, ebap_id, atividade, local_atividade, equipe, riscos, medidas_controle,
      epis_obrigatorios, responsavel_id, autorizador_id, status, inicio_previsto, fim_previsto,
      liberada_em, encerrada_em, observacoes, created_by
    )
    values (
      upper(trim(p_codigo)), p_apr_id, p_os_id, p_ebap_id, trim(p_atividade), nullif(trim(coalesce(p_local_atividade, '')), ''),
      nullif(trim(coalesce(p_equipe, '')), ''), nullif(trim(coalesce(p_riscos, '')), ''), nullif(trim(coalesce(p_medidas_controle, '')), ''),
      nullif(trim(coalesce(p_epis_obrigatorios, '')), ''), p_responsavel_id, p_autorizador_id, coalesce(p_status, 'rascunho'),
      p_inicio_previsto, p_fim_previsto,
      case when p_status = 'liberada' then now() else null end,
      case when p_status = 'encerrada' then now() else null end,
      nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id
    )
    returning * into v_apt;
  else
    update public.apt
       set codigo = upper(trim(p_codigo)),
           apr_id = p_apr_id,
           os_id = p_os_id,
           ebap_id = p_ebap_id,
           atividade = trim(p_atividade),
           local_atividade = nullif(trim(coalesce(p_local_atividade, '')), ''),
           equipe = nullif(trim(coalesce(p_equipe, '')), ''),
           riscos = nullif(trim(coalesce(p_riscos, '')), ''),
           medidas_controle = nullif(trim(coalesce(p_medidas_controle, '')), ''),
           epis_obrigatorios = nullif(trim(coalesce(p_epis_obrigatorios, '')), ''),
           responsavel_id = p_responsavel_id,
           autorizador_id = p_autorizador_id,
           status = coalesce(p_status, 'rascunho'),
           inicio_previsto = p_inicio_previsto,
           fim_previsto = p_fim_previsto,
           liberada_em = case when p_status = 'liberada' and liberada_em is null then now() else liberada_em end,
           encerrada_em = case when p_status = 'encerrada' and encerrada_em is null then now() else encerrada_em end,
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_apt;
  end if;

  if v_apt.id is null then
    raise exception 'APT nao encontrada.';
  end if;

  return v_apt;
end;
$$;

create or replace function public.sst_salvar_inspecao(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_tipo text,
  p_os_id uuid,
  p_ebap_id uuid,
  p_apr_id uuid,
  p_apt_id uuid,
  p_responsavel_id uuid,
  p_data_inspecao date,
  p_status text,
  p_resultado text,
  p_nao_conformidades text,
  p_recomendacoes text,
  p_observacoes text
)
returns public.inspecoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inspecao public.inspecoes;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar inspecoes.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 or length(trim(coalesce(p_tipo, ''))) < 2 then
    raise exception 'Codigo e tipo da inspecao sao obrigatorios.';
  end if;

  if p_id is null then
    insert into public.inspecoes (codigo, tipo, os_id, ebap_id, apr_id, apt_id, responsavel_id, data_inspecao, status, resultado, nao_conformidades, recomendacoes, observacoes, created_by)
    values (upper(trim(p_codigo)), trim(p_tipo), p_os_id, p_ebap_id, p_apr_id, p_apt_id, p_responsavel_id, coalesce(p_data_inspecao, current_date), coalesce(p_status, 'aberta'), nullif(trim(coalesce(p_resultado, '')), ''), nullif(trim(coalesce(p_nao_conformidades, '')), ''), nullif(trim(coalesce(p_recomendacoes, '')), ''), nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id)
    returning * into v_inspecao;
  else
    update public.inspecoes
       set codigo = upper(trim(p_codigo)), tipo = trim(p_tipo), os_id = p_os_id, ebap_id = p_ebap_id,
           apr_id = p_apr_id, apt_id = p_apt_id, responsavel_id = p_responsavel_id,
           data_inspecao = coalesce(p_data_inspecao, current_date), status = coalesce(p_status, 'aberta'),
           resultado = nullif(trim(coalesce(p_resultado, '')), ''),
           nao_conformidades = nullif(trim(coalesce(p_nao_conformidades, '')), ''),
           recomendacoes = nullif(trim(coalesce(p_recomendacoes, '')), ''),
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           updated_at = now()
     where id = p_id and deleted_at is null
     returning * into v_inspecao;
  end if;

  if v_inspecao.id is null then
    raise exception 'Inspecao nao encontrada.';
  end if;

  return v_inspecao;
end;
$$;

create or replace function public.sst_salvar_ocorrencia(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_os_id uuid,
  p_ebap_id uuid,
  p_apr_id uuid,
  p_apt_id uuid,
  p_inspecao_id uuid,
  p_tipo text,
  p_gravidade text,
  p_descricao text,
  p_acao_imediata text,
  p_envolvido_id uuid,
  p_ocorrido_em timestamptz,
  p_status text
)
returns public.ocorrencias
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ocorrencia public.ocorrencias;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar ocorrencias.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 or length(trim(coalesce(p_descricao, ''))) < 5 then
    raise exception 'Codigo e descricao da ocorrencia sao obrigatorios.';
  end if;

  if p_id is null then
    insert into public.ocorrencias (codigo, os_id, ebap_id, apr_id, apt_id, inspecao_id, tipo, gravidade, descricao, acao_imediata, envolvido_id, registrado_por, ocorrido_em, status)
    values (upper(trim(p_codigo)), p_os_id, p_ebap_id, p_apr_id, p_apt_id, p_inspecao_id, p_tipo, coalesce(p_gravidade, 'baixa'), trim(p_descricao), nullif(trim(coalesce(p_acao_imediata, '')), ''), p_envolvido_id, p_user_id, p_ocorrido_em, coalesce(p_status, 'aberta'))
    returning * into v_ocorrencia;
  else
    update public.ocorrencias
       set codigo = upper(trim(p_codigo)), os_id = p_os_id, ebap_id = p_ebap_id, apr_id = p_apr_id,
           apt_id = p_apt_id, inspecao_id = p_inspecao_id, tipo = p_tipo, gravidade = coalesce(p_gravidade, 'baixa'),
           descricao = trim(p_descricao), acao_imediata = nullif(trim(coalesce(p_acao_imediata, '')), ''),
           envolvido_id = p_envolvido_id, ocorrido_em = p_ocorrido_em, status = coalesce(p_status, 'aberta'),
           updated_at = now()
     where id = p_id and deleted_at is null
     returning * into v_ocorrencia;
  end if;

  if v_ocorrencia.id is null then
    raise exception 'Ocorrencia nao encontrada.';
  end if;

  return v_ocorrencia;
end;
$$;

create or replace function public.sst_salvar_plano_acao(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_origem_tipo text,
  p_origem_id uuid,
  p_os_id uuid,
  p_ebap_id uuid,
  p_descricao text,
  p_responsavel_id uuid,
  p_prioridade text,
  p_prazo date,
  p_status text,
  p_observacoes text
)
returns public.planos_acao
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano public.planos_acao;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar plano de acao.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 or length(trim(coalesce(p_descricao, ''))) < 5 then
    raise exception 'Codigo e descricao do plano sao obrigatorios.';
  end if;

  if p_id is null then
    insert into public.planos_acao (codigo, origem_tipo, origem_id, os_id, ebap_id, descricao, responsavel_id, prioridade, prazo, status, concluido_em, observacoes, created_by)
    values (upper(trim(p_codigo)), coalesce(p_origem_tipo, 'outro'), p_origem_id, p_os_id, p_ebap_id, trim(p_descricao), p_responsavel_id, coalesce(p_prioridade, 'media'), p_prazo, coalesce(p_status, 'aberto'), case when p_status = 'concluido' then now() else null end, nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id)
    returning * into v_plano;
  else
    update public.planos_acao
       set codigo = upper(trim(p_codigo)), origem_tipo = coalesce(p_origem_tipo, 'outro'), origem_id = p_origem_id,
           os_id = p_os_id, ebap_id = p_ebap_id, descricao = trim(p_descricao), responsavel_id = p_responsavel_id,
           prioridade = coalesce(p_prioridade, 'media'), prazo = p_prazo, status = coalesce(p_status, 'aberto'),
           concluido_em = case when p_status = 'concluido' and concluido_em is null then now() else concluido_em end,
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''), updated_at = now()
     where id = p_id and deleted_at is null
     returning * into v_plano;
  end if;

  if v_plano.id is null then
    raise exception 'Plano de acao nao encontrado.';
  end if;

  return v_plano;
end;
$$;

grant execute on function public.sst_salvar_apt(uuid, uuid, text, uuid, uuid, uuid, text, text, text, text, text, text, uuid, uuid, text, timestamptz, timestamptz, text) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_inspecao(uuid, uuid, text, text, uuid, uuid, uuid, uuid, uuid, date, text, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_ocorrencia(uuid, uuid, text, uuid, uuid, uuid, uuid, uuid, text, text, text, text, uuid, timestamptz, text) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_plano_acao(uuid, uuid, text, text, uuid, uuid, uuid, text, uuid, text, date, text, text) to anon, authenticated, service_role;
