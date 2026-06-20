-- Fase 10.1 - SST Base
-- Execute antes do arquivo RLS complementar.

create table if not exists public.epi_itens (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  ca text,
  validade_ca date,
  categoria text,
  fabricante text,
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  ativo boolean not null default true,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.epi_entregas (
  id uuid primary key default gen_random_uuid(),
  epi_id uuid not null references public.epi_itens(id) on delete restrict,
  funcionario_id uuid not null references public.usuarios(id) on delete restrict,
  quantidade integer not null default 1 check (quantidade > 0),
  entregue_em date not null default current_date,
  validade_uso date,
  os_id uuid references public.ordens_servico(id) on delete set null,
  entregue_por uuid references public.usuarios(id) on delete set null,
  assinatura_path text,
  observacoes text,
  devolvido_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  norma text,
  categoria text,
  carga_horaria numeric(6,2),
  validade_meses integer check (validade_meses is null or validade_meses > 0),
  obrigatorio boolean not null default true,
  ativo boolean not null default true,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.funcionario_treinamentos (
  id uuid primary key default gen_random_uuid(),
  treinamento_id uuid not null references public.treinamentos(id) on delete restrict,
  funcionario_id uuid not null references public.usuarios(id) on delete cascade,
  realizado_em date,
  valido_ate date,
  certificado_bucket text,
  certificado_path text,
  os_id uuid references public.ordens_servico(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente','valido','vencendo','vencido','dispensado')),
  observacoes text,
  registrado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null,
  unique (treinamento_id, funcionario_id, realizado_em)
);

create table if not exists public.apr (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  atividade text not null,
  local_atividade text,
  riscos text,
  medidas_controle text,
  epis_obrigatorios text,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho','em_analise','liberada','reprovada','encerrada','cancelada')),
  inicio_previsto timestamptz,
  fim_previsto timestamptz,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create index if not exists idx_epi_itens_ativo on public.epi_itens(ativo) where deleted_at is null;
create index if not exists idx_epi_itens_ca on public.epi_itens(ca) where deleted_at is null;
create index if not exists idx_epi_entregas_funcionario on public.epi_entregas(funcionario_id, entregue_em desc) where deleted_at is null;
create index if not exists idx_epi_entregas_epi on public.epi_entregas(epi_id, entregue_em desc) where deleted_at is null;
create index if not exists idx_treinamentos_ativo on public.treinamentos(ativo) where deleted_at is null;
create index if not exists idx_funcionario_treinamentos_funcionario on public.funcionario_treinamentos(funcionario_id, status, valido_ate) where deleted_at is null;
create index if not exists idx_funcionario_treinamentos_vencimento on public.funcionario_treinamentos(valido_ate, status) where deleted_at is null;
create index if not exists idx_apr_status on public.apr(status) where deleted_at is null;
create index if not exists idx_apr_os on public.apr(os_id) where deleted_at is null;

create or replace function public.is_sst_manager(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = p_user_id
      and u.ativo = true
      and u.deleted_at is null
      and u.perfil in ('sst','supervisor','gerencia','diretoria')
  );
$$;

create or replace function public.sst_status_treinamento(p_valido_ate date)
returns text
language sql
stable
as $$
  select case
    when p_valido_ate is null then 'pendente'
    when p_valido_ate < current_date then 'vencido'
    when p_valido_ate <= current_date + interval '30 days' then 'vencendo'
    else 'valido'
  end;
$$;

create or replace function public.sst_salvar_epi(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_nome text,
  p_ca text,
  p_validade_ca date,
  p_categoria text,
  p_fabricante text,
  p_estoque_minimo integer,
  p_ativo boolean
)
returns public.epi_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_epi public.epi_itens;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar SST.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo do EPI e obrigatorio.';
  end if;

  if length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Nome do EPI deve possuir pelo menos 3 caracteres.';
  end if;

  if p_id is null then
    insert into public.epi_itens (codigo, nome, ca, validade_ca, categoria, fabricante, estoque_minimo, ativo, created_by)
    values (upper(trim(p_codigo)), trim(p_nome), nullif(trim(coalesce(p_ca, '')), ''), p_validade_ca, nullif(trim(coalesce(p_categoria, '')), ''), nullif(trim(coalesce(p_fabricante, '')), ''), coalesce(p_estoque_minimo, 0), coalesce(p_ativo, true), p_user_id)
    returning * into v_epi;
  else
    update public.epi_itens
       set codigo = upper(trim(p_codigo)),
           nome = trim(p_nome),
           ca = nullif(trim(coalesce(p_ca, '')), ''),
           validade_ca = p_validade_ca,
           categoria = nullif(trim(coalesce(p_categoria, '')), ''),
           fabricante = nullif(trim(coalesce(p_fabricante, '')), ''),
           estoque_minimo = coalesce(p_estoque_minimo, 0),
           ativo = coalesce(p_ativo, true),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_epi;
  end if;

  if v_epi.id is null then
    raise exception 'EPI nao encontrado.';
  end if;

  return v_epi;
end;
$$;

create or replace function public.sst_registrar_entrega_epi(
  p_user_id uuid,
  p_epi_id uuid,
  p_funcionario_id uuid,
  p_quantidade integer,
  p_entregue_em date,
  p_validade_uso date,
  p_os_id uuid,
  p_observacoes text
)
returns public.epi_entregas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entrega public.epi_entregas;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para entregar EPI.';
  end if;

  if coalesce(p_quantidade, 0) <= 0 then
    raise exception 'Quantidade deve ser maior que zero.';
  end if;

  insert into public.epi_entregas (epi_id, funcionario_id, quantidade, entregue_em, validade_uso, os_id, entregue_por, observacoes)
  values (p_epi_id, p_funcionario_id, p_quantidade, coalesce(p_entregue_em, current_date), p_validade_uso, p_os_id, p_user_id, nullif(trim(coalesce(p_observacoes, '')), ''))
  returning * into v_entrega;

  return v_entrega;
end;
$$;

create or replace function public.sst_salvar_treinamento(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_nome text,
  p_norma text,
  p_categoria text,
  p_carga_horaria numeric,
  p_validade_meses integer,
  p_obrigatorio boolean,
  p_ativo boolean
)
returns public.treinamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_treinamento public.treinamentos;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar treinamentos.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo do treinamento e obrigatorio.';
  end if;

  if length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Nome do treinamento deve possuir pelo menos 3 caracteres.';
  end if;

  if p_id is null then
    insert into public.treinamentos (codigo, nome, norma, categoria, carga_horaria, validade_meses, obrigatorio, ativo, created_by)
    values (upper(trim(p_codigo)), trim(p_nome), nullif(trim(coalesce(p_norma, '')), ''), nullif(trim(coalesce(p_categoria, '')), ''), p_carga_horaria, p_validade_meses, coalesce(p_obrigatorio, true), coalesce(p_ativo, true), p_user_id)
    returning * into v_treinamento;
  else
    update public.treinamentos
       set codigo = upper(trim(p_codigo)),
           nome = trim(p_nome),
           norma = nullif(trim(coalesce(p_norma, '')), ''),
           categoria = nullif(trim(coalesce(p_categoria, '')), ''),
           carga_horaria = p_carga_horaria,
           validade_meses = p_validade_meses,
           obrigatorio = coalesce(p_obrigatorio, true),
           ativo = coalesce(p_ativo, true),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_treinamento;
  end if;

  if v_treinamento.id is null then
    raise exception 'Treinamento nao encontrado.';
  end if;

  return v_treinamento;
end;
$$;

create or replace function public.sst_registrar_funcionario_treinamento(
  p_user_id uuid,
  p_treinamento_id uuid,
  p_funcionario_id uuid,
  p_realizado_em date,
  p_valido_ate date,
  p_os_id uuid,
  p_observacoes text,
  p_status text default null
)
returns public.funcionario_treinamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro public.funcionario_treinamentos;
  v_status text;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para registrar treinamento.';
  end if;

  v_status := coalesce(nullif(p_status, ''), public.sst_status_treinamento(p_valido_ate));

  insert into public.funcionario_treinamentos (treinamento_id, funcionario_id, realizado_em, valido_ate, os_id, status, observacoes, registrado_por)
  values (p_treinamento_id, p_funcionario_id, p_realizado_em, p_valido_ate, p_os_id, v_status, nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id)
  returning * into v_registro;

  return v_registro;
end;
$$;

create or replace function public.sst_salvar_apr(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_os_id uuid,
  p_ebap_id uuid,
  p_atividade text,
  p_local_atividade text,
  p_riscos text,
  p_medidas_controle text,
  p_epis_obrigatorios text,
  p_responsavel_id uuid,
  p_status text,
  p_inicio_previsto timestamptz,
  p_fim_previsto timestamptz,
  p_observacoes text
)
returns public.apr
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apr public.apr;
begin
  if not public.is_sst_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar APR.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo da APR e obrigatorio.';
  end if;

  if length(trim(coalesce(p_atividade, ''))) < 5 then
    raise exception 'Atividade da APR deve possuir pelo menos 5 caracteres.';
  end if;

  if p_id is null then
    insert into public.apr (codigo, os_id, ebap_id, atividade, local_atividade, riscos, medidas_controle, epis_obrigatorios, responsavel_id, status, inicio_previsto, fim_previsto, observacoes, created_by)
    values (upper(trim(p_codigo)), p_os_id, p_ebap_id, trim(p_atividade), nullif(trim(coalesce(p_local_atividade, '')), ''), nullif(trim(coalesce(p_riscos, '')), ''), nullif(trim(coalesce(p_medidas_controle, '')), ''), nullif(trim(coalesce(p_epis_obrigatorios, '')), ''), p_responsavel_id, coalesce(p_status, 'rascunho'), p_inicio_previsto, p_fim_previsto, nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id)
    returning * into v_apr;
  else
    update public.apr
       set codigo = upper(trim(p_codigo)),
           os_id = p_os_id,
           ebap_id = p_ebap_id,
           atividade = trim(p_atividade),
           local_atividade = nullif(trim(coalesce(p_local_atividade, '')), ''),
           riscos = nullif(trim(coalesce(p_riscos, '')), ''),
           medidas_controle = nullif(trim(coalesce(p_medidas_controle, '')), ''),
           epis_obrigatorios = nullif(trim(coalesce(p_epis_obrigatorios, '')), ''),
           responsavel_id = p_responsavel_id,
           status = coalesce(p_status, 'rascunho'),
           inicio_previsto = p_inicio_previsto,
           fim_previsto = p_fim_previsto,
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_apr;
  end if;

  if v_apr.id is null then
    raise exception 'APR nao encontrada.';
  end if;

  return v_apr;
end;
$$;

grant execute on function public.is_sst_manager(uuid) to anon, authenticated, service_role;
grant execute on function public.sst_status_treinamento(date) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_epi(uuid, uuid, text, text, text, date, text, text, integer, boolean) to anon, authenticated, service_role;
grant execute on function public.sst_registrar_entrega_epi(uuid, uuid, uuid, integer, date, date, uuid, text) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_treinamento(uuid, uuid, text, text, text, text, numeric, integer, boolean, boolean) to anon, authenticated, service_role;
grant execute on function public.sst_registrar_funcionario_treinamento(uuid, uuid, uuid, date, date, uuid, text, text) to anon, authenticated, service_role;
grant execute on function public.sst_salvar_apr(uuid, uuid, text, uuid, uuid, text, text, text, text, text, uuid, text, timestamptz, timestamptz, text) to anon, authenticated, service_role;
