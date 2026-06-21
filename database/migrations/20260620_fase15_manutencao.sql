-- Fase 15 - Manutencao Preventiva, Preditiva e Corretiva

create table if not exists public.manutencao_planos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  area text not null check (area in ('mecanica','eletrica','automacao','operacional')),
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  frequencia text not null check (frequencia in ('diaria','semanal','quinzenal','mensal','trimestral','semestral','anual')),
  responsavel_id uuid references public.usuarios(id) on delete set null,
  checklist jsonb not null default '[]'::jsonb,
  tipo text not null default 'preventiva' check (tipo in ('preventiva','preditiva','corretiva')),
  prioridade text not null default 'media' check (prioridade in ('baixa','media','alta','critica')),
  proxima_execucao date not null default current_date,
  ultima_execucao date,
  ativo boolean not null default true,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create table if not exists public.manutencao_execucoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references public.manutencao_planos(id) on delete set null,
  os_id uuid references public.ordens_servico(id) on delete set null,
  ebap_id uuid references public.ebaps(id) on delete set null,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  tipo text not null default 'preventiva' check (tipo in ('preventiva','preditiva','corretiva')),
  status text not null default 'pendente' check (status in ('pendente','programada','em_execucao','concluida','atrasada','cancelada')),
  data_programada date not null default current_date,
  data_execucao date,
  checklist_resultado jsonb not null default '[]'::jsonb,
  responsavel_id uuid references public.usuarios(id) on delete set null,
  observacoes text,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.usuarios(id) on delete set null
);

create index if not exists idx_manutencao_planos_ativo_proxima
  on public.manutencao_planos(ativo, proxima_execucao)
  where deleted_at is null;

create index if not exists idx_manutencao_planos_area
  on public.manutencao_planos(area)
  where deleted_at is null;

create index if not exists idx_manutencao_planos_ebap
  on public.manutencao_planos(ebap_id)
  where deleted_at is null;

create index if not exists idx_manutencao_execucoes_status_data
  on public.manutencao_execucoes(status, data_programada)
  where deleted_at is null;

create index if not exists idx_manutencao_execucoes_os
  on public.manutencao_execucoes(os_id)
  where deleted_at is null;

create or replace function public.is_manutencao_manager(p_user_id uuid)
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
      and u.perfil in ('supervisor','gerencia','diretoria')
  );
$$;

create or replace function public.manutencao_proxima_data(p_data date, p_frequencia text)
returns date
language sql
stable
as $$
  select case p_frequencia
    when 'diaria' then p_data + interval '1 day'
    when 'semanal' then p_data + interval '7 days'
    when 'quinzenal' then p_data + interval '15 days'
    when 'mensal' then p_data + interval '1 month'
    when 'trimestral' then p_data + interval '3 months'
    when 'semestral' then p_data + interval '6 months'
    when 'anual' then p_data + interval '1 year'
    else p_data + interval '1 month'
  end::date;
$$;

create or replace function public.manutencao_salvar_plano(
  p_user_id uuid,
  p_id uuid,
  p_codigo text,
  p_nome text,
  p_ebap_id uuid,
  p_area text,
  p_equipamento_id uuid,
  p_frequencia text,
  p_responsavel_id uuid,
  p_checklist jsonb,
  p_tipo text,
  p_prioridade text,
  p_proxima_execucao date,
  p_ativo boolean,
  p_observacoes text
)
returns public.manutencao_planos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano public.manutencao_planos;
begin
  if not public.is_manutencao_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar manutencao.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo do plano e obrigatorio.';
  end if;

  if length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Nome do plano deve possuir pelo menos 3 caracteres.';
  end if;

  if p_area not in ('mecanica','eletrica','automacao','operacional') then
    raise exception 'Area de manutencao invalida.';
  end if;

  if p_frequencia not in ('diaria','semanal','quinzenal','mensal','trimestral','semestral','anual') then
    raise exception 'Frequencia invalida.';
  end if;

  if p_id is null then
    insert into public.manutencao_planos (
      codigo, nome, ebap_id, area, equipamento_id, frequencia, responsavel_id, checklist,
      tipo, prioridade, proxima_execucao, ativo, observacoes, created_by
    )
    values (
      upper(trim(p_codigo)), trim(p_nome), p_ebap_id, p_area, p_equipamento_id, p_frequencia, p_responsavel_id,
      coalesce(p_checklist, '[]'::jsonb), coalesce(p_tipo, 'preventiva'), coalesce(p_prioridade, 'media'),
      coalesce(p_proxima_execucao, current_date), coalesce(p_ativo, true),
      nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id
    )
    returning * into v_plano;
  else
    update public.manutencao_planos
       set codigo = upper(trim(p_codigo)),
           nome = trim(p_nome),
           ebap_id = p_ebap_id,
           area = p_area,
           equipamento_id = p_equipamento_id,
           frequencia = p_frequencia,
           responsavel_id = p_responsavel_id,
           checklist = coalesce(p_checklist, '[]'::jsonb),
           tipo = coalesce(p_tipo, 'preventiva'),
           prioridade = coalesce(p_prioridade, 'media'),
           proxima_execucao = coalesce(p_proxima_execucao, proxima_execucao),
           ativo = coalesce(p_ativo, true),
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_plano;
  end if;

  if v_plano.id is null then
    raise exception 'Plano de manutencao nao encontrado.';
  end if;

  return v_plano;
end;
$$;

create or replace function public.manutencao_registrar_execucao(
  p_user_id uuid,
  p_id uuid,
  p_plano_id uuid,
  p_os_id uuid,
  p_status text,
  p_data_programada date,
  p_data_execucao date,
  p_checklist_resultado jsonb,
  p_observacoes text
)
returns public.manutencao_execucoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano public.manutencao_planos;
  v_exec public.manutencao_execucoes;
begin
  if not public.is_manutencao_manager(p_user_id) then
    raise exception 'Usuario sem permissao para registrar execucao de manutencao.';
  end if;

  select * into v_plano
  from public.manutencao_planos
  where id = p_plano_id
    and deleted_at is null;

  if v_plano.id is null then
    raise exception 'Plano de manutencao nao encontrado.';
  end if;

  if p_id is null then
    insert into public.manutencao_execucoes (
      plano_id, os_id, ebap_id, equipamento_id, tipo, status, data_programada, data_execucao,
      checklist_resultado, responsavel_id, observacoes, created_by
    )
    values (
      v_plano.id, p_os_id, v_plano.ebap_id, v_plano.equipamento_id, v_plano.tipo, coalesce(p_status, 'pendente'),
      coalesce(p_data_programada, v_plano.proxima_execucao), p_data_execucao, coalesce(p_checklist_resultado, '[]'::jsonb),
      v_plano.responsavel_id, nullif(trim(coalesce(p_observacoes, '')), ''), p_user_id
    )
    returning * into v_exec;
  else
    update public.manutencao_execucoes
       set os_id = p_os_id,
           status = coalesce(p_status, status),
           data_programada = coalesce(p_data_programada, data_programada),
           data_execucao = p_data_execucao,
           checklist_resultado = coalesce(p_checklist_resultado, checklist_resultado),
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           updated_at = now()
     where id = p_id
       and deleted_at is null
     returning * into v_exec;
  end if;

  if v_exec.id is null then
    raise exception 'Execucao de manutencao nao encontrada.';
  end if;

  if v_exec.status = 'concluida' and v_exec.data_execucao is not null then
    update public.manutencao_planos
       set ultima_execucao = v_exec.data_execucao,
           proxima_execucao = public.manutencao_proxima_data(v_exec.data_execucao, frequencia),
           updated_at = now()
     where id = v_plano.id;
  end if;

  return v_exec;
end;
$$;

create or replace function public.manutencao_gerar_os_vencidas(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano public.manutencao_planos;
  v_os public.ordens_servico;
  v_count integer := 0;
  v_numero text;
begin
  if not public.is_manutencao_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerar OS de manutencao.';
  end if;

  for v_plano in
    select *
    from public.manutencao_planos p
    where p.ativo = true
      and p.deleted_at is null
      and p.proxima_execucao <= current_date
      and not exists (
        select 1
        from public.manutencao_execucoes e
        where e.plano_id = p.id
          and e.deleted_at is null
          and e.data_programada = p.proxima_execucao
          and e.status in ('pendente','programada','em_execucao')
      )
    order by p.proxima_execucao asc
  loop
    v_numero := 'OS-MAN-' || to_char(now(), 'YYYYMMDDHH24MISSMS') || '-' || substr(v_plano.id::text, 1, 4);

    insert into public.ordens_servico (
      numero, origem, ebap_id, equipamento_id, solicitante_id, responsavel_id, titulo, descricao,
      area, prioridade, status, data_programada, created_by, payload
    )
    values (
      v_numero,
      'manutencao',
      v_plano.ebap_id,
      v_plano.equipamento_id,
      p_user_id,
      v_plano.responsavel_id,
      'Manutencao ' || v_plano.tipo || ' - ' || v_plano.nome,
      'OS gerada automaticamente pelo plano de manutencao ' || v_plano.codigo || '.',
      v_plano.area,
      v_plano.prioridade,
      'aberta',
      v_plano.proxima_execucao,
      p_user_id,
      jsonb_build_object(
        'origem_modulo', 'manutencao',
        'plano_id', v_plano.id,
        'plano_codigo', v_plano.codigo,
        'frequencia', v_plano.frequencia,
        'checklist', v_plano.checklist,
        'equipamento_falha', coalesce((select nome from public.equipamentos where id = v_plano.equipamento_id), 'Plano de manutencao')
      )
    )
    returning * into v_os;

    insert into public.manutencao_execucoes (
      plano_id, os_id, ebap_id, equipamento_id, tipo, status, data_programada,
      checklist_resultado, responsavel_id, created_by
    )
    values (
      v_plano.id, v_os.id, v_plano.ebap_id, v_plano.equipamento_id, v_plano.tipo,
      'programada', v_plano.proxima_execucao, v_plano.checklist, v_plano.responsavel_id, p_user_id
    );

    insert into public.os_historico (os_id, usuario_id, acao, status_anterior, status_novo, descricao, metadata)
    values (
      v_os.id, p_user_id, 'gerada_manutencao', null, 'aberta',
      'OS gerada automaticamente por plano de manutencao vencido.',
      jsonb_build_object('plano_id', v_plano.id, 'plano_codigo', v_plano.codigo)
    );

    insert into public.notificacoes (usuario_id, perfil_destino, titulo, mensagem, tipo, entidade_tipo, entidade_id)
    values (
      v_plano.responsavel_id, 'supervisor', 'OS de manutencao gerada',
      v_os.numero || ' foi gerada pelo plano ' || v_plano.codigo || '.',
      'alerta', 'ordem_servico', v_os.id
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.is_manutencao_manager(uuid) to anon, authenticated, service_role;
grant execute on function public.manutencao_proxima_data(date, text) to anon, authenticated, service_role;
grant execute on function public.manutencao_salvar_plano(uuid, uuid, text, text, uuid, text, uuid, text, uuid, jsonb, text, text, date, boolean, text) to anon, authenticated, service_role;
grant execute on function public.manutencao_registrar_execucao(uuid, uuid, uuid, uuid, text, date, date, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.manutencao_gerar_os_vencidas(uuid) to anon, authenticated, service_role;
