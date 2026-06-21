alter table public.ordens_servico
  drop constraint if exists ordens_servico_status_check;

alter table public.ordens_servico
  add constraint ordens_servico_status_check
  check (status in (
    'pendente_cco',
    'aprovada_cco',
    'rejeitada_cco',
    'correcao_solicitada_cco',
    'solicitada_prefeitura',
    'aguardando_supervisor',
    'analise_supervisor',
    'programada',
    'encaminhada_tecnicos',
    'em_execucao',
    'concluida_tecnicos',
    'validacao_supervisor',
    'enviada_prefeitura',
    'aguardando_validacao_prefeitura',
    'nao_conforme',
    'concluida_arquivada',
    'aberta',
    'em_analise',
    'enviada_cco',
    'validada_cco',
    'devolvida_cco',
    'aguardando_material',
    'execucao_concluida',
    'aguardando_prefeitura',
    'concluida',
    'finalizada',
    'arquivada',
    'rejeitada',
    'cancelada'
  ));

alter table public.validacoes_cco
  drop constraint if exists validacoes_cco_status_check;

alter table public.validacoes_cco
  add constraint validacoes_cco_status_check
  check (status in (
    'pendente',
    'validado',
    'validado_com_restricao',
    'nao_validado',
    'devolvido',
    'aguardando_correcao',
    'aprovada_os',
    'rejeitada_os',
    'correcao_solicitada_os'
  ));

create index if not exists idx_os_cco_fila
  on public.ordens_servico(status, origem, prioridade, created_at desc)
  where deleted_at is null;

create index if not exists idx_validacoes_cco_os
  on public.validacoes_cco(os_id, created_at desc)
  where os_id is not null;

create or replace function public.is_cco_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.usuarios
     where id = p_user_id
       and ativo = true
       and deleted_at is null
       and perfil in ('cco','gerencia','diretoria')
  );
$$;

create or replace function public.cco_validar_os(
  p_user_id uuid,
  p_os_id uuid,
  p_acao text,
  p_motivo text default null
)
returns public.ordens_servico
language plpgsql
security definer
set search_path = public
as $$
declare
  v_os public.ordens_servico;
  v_old_status text;
  v_new_status text;
  v_validation_status text;
  v_hist_action text;
  v_title text;
  v_message text;
begin
  if not public.is_cco_user(p_user_id) then
    raise exception 'Usuario sem permissao para validar OS no CCO.';
  end if;

  if p_acao not in ('aprovar','rejeitar','corrigir') then
    raise exception 'Acao de validacao invalida.';
  end if;

  if p_acao in ('rejeitar','corrigir') and (nullif(trim(coalesce(p_motivo, '')), '') is null or length(trim(p_motivo)) < 5) then
    raise exception 'Motivo obrigatorio com pelo menos 5 caracteres.';
  end if;

  select *
    into v_os
    from public.ordens_servico
   where id = p_os_id
     and deleted_at is null
   for update;

  if v_os.id is null then
    raise exception 'OS nao encontrada.';
  end if;

  v_old_status := v_os.status;

  if p_acao = 'aprovar' then
    v_new_status := 'aprovada_cco';
    v_validation_status := 'aprovada_os';
    v_hist_action := 'cco_aprovou_os';
    v_title := 'OS aprovada pelo CCO';
    v_message := v_os.numero || ' foi aprovada pelo CCO e encaminhada ao Supervisor.';
  elsif p_acao = 'rejeitar' then
    v_new_status := 'rejeitada_cco';
    v_validation_status := 'rejeitada_os';
    v_hist_action := 'cco_rejeitou_os';
    v_title := 'OS rejeitada pelo CCO';
    v_message := v_os.numero || ' foi rejeitada pelo CCO. Motivo: ' || trim(p_motivo);
  else
    v_new_status := 'correcao_solicitada_cco';
    v_validation_status := 'correcao_solicitada_os';
    v_hist_action := 'cco_solicitou_correcao_os';
    v_title := 'Correcao solicitada pelo CCO';
    v_message := v_os.numero || ' precisa de correcao antes de seguir. Motivo: ' || trim(p_motivo);
  end if;

  insert into public.validacoes_cco (
    os_id,
    operador_cco_id,
    status,
    motivo_devolucao,
    observacoes,
    validado_em
  )
  values (
    p_os_id,
    p_user_id,
    v_validation_status,
    case when p_acao in ('rejeitar','corrigir') then trim(p_motivo) else null end,
    nullif(trim(coalesce(p_motivo, '')), ''),
    now()
  );

  update public.ordens_servico
     set status = v_new_status,
         responsavel_id = case when p_acao = 'aprovar' then responsavel_id else responsavel_id end,
         payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
           'cco_os', jsonb_build_object(
             'acao', p_acao,
             'status_anterior', v_old_status,
             'status_novo', v_new_status,
             'motivo', nullif(trim(coalesce(p_motivo, '')), ''),
             'validado_por', p_user_id,
             'validado_em', now(),
             'roteamento_base', 'area',
             'area', area
           )
         ),
         updated_at = now()
   where id = p_os_id
  returning * into v_os;

  insert into public.os_historico (os_id, usuario_id, acao, status_anterior, status_novo, descricao, metadata)
  values (
    p_os_id,
    p_user_id,
    v_hist_action,
    v_old_status,
    v_new_status,
    v_title || coalesce(' - ' || nullif(trim(p_motivo), ''), ''),
    jsonb_build_object('motivo', nullif(trim(coalesce(p_motivo, '')), ''), 'area', v_os.area, 'origem', v_os.origem)
  );

  insert into public.auditoria (usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
  values (
    p_user_id,
    'ordens_servico',
    p_os_id,
    case when p_acao = 'aprovar' then 'approve' when p_acao = 'rejeitar' then 'reject' else 'update' end,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', v_new_status, 'acao', p_acao, 'motivo', nullif(trim(coalesce(p_motivo, '')), ''))
  );

  if p_acao = 'aprovar' then
    insert into public.notificacoes (
      usuario_id, perfil_destino, titulo, mensagem, tipo, entidade_tipo, entidade_id, modulo, prioridade, metadata, acao_url
    )
    values (
      null,
      'supervisor',
      v_title,
      v_message,
      'alerta',
      'ordem_servico',
      p_os_id,
      'os',
      case when v_os.prioridade = 'critica' then 'critica' when v_os.prioridade in ('alta','urgente') then 'alta' else 'normal' end,
      jsonb_build_object('area', v_os.area, 'origem', v_os.origem, 'roteamento_base', 'area'),
      '/os/' || p_os_id
    );
  else
    insert into public.notificacoes (
      usuario_id, perfil_destino, titulo, mensagem, tipo, entidade_tipo, entidade_id, modulo, prioridade, metadata, acao_url
    )
    values (
      v_os.solicitante_id,
      case when v_os.solicitante_id is null then 'operador' else null end,
      v_title,
      v_message,
      'alerta',
      'ordem_servico',
      p_os_id,
      'os',
      case when p_acao = 'rejeitar' then 'alta' else 'normal' end,
      jsonb_build_object('motivo', nullif(trim(coalesce(p_motivo, '')), ''), 'acao', p_acao),
      '/os/' || p_os_id
    );
  end if;

  return v_os;
end;
$$;

grant execute on function public.is_cco_user(uuid) to anon, authenticated, service_role;
grant execute on function public.cco_validar_os(uuid, uuid, text, text) to anon, authenticated, service_role;
