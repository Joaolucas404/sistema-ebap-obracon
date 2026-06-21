alter table public.ordens_servico
  drop constraint if exists ordens_servico_status_check;

alter table public.ordens_servico
  add constraint ordens_servico_status_check
  check (status in (
    'pendente_cco','aprovada_cco','rejeitada_cco','correcao_solicitada_cco',
    'solicitada_prefeitura','aguardando_supervisor','analise_supervisor','programada',
    'encaminhada_tecnicos','em_execucao','pausada','concluida_tecnicos','validacao_supervisor',
    'enviada_prefeitura','aguardando_validacao_prefeitura','nao_conforme','concluida_arquivada',
    'aberta','em_analise','enviada_cco','validada_cco','devolvida_cco','aguardando_material',
    'execucao_concluida','aguardando_prefeitura','concluida','finalizada','arquivada','rejeitada','cancelada'
  ));

create index if not exists idx_os_diaria_programacao
  on public.ordens_servico(data_programada, responsavel_id, status)
  where deleted_at is null;

create or replace function public.is_os_diaria_user(p_user_id uuid)
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
       and perfil in ('tecnico','supervisor','gerencia','diretoria')
  );
$$;

create or replace function public.os_diaria_exige_sst(p_os public.ordens_servico)
returns boolean
language sql
stable
as $$
  select coalesce(p_os.area, '') in ('mecanica','eletrica','automacao')
     and coalesce(p_os.prioridade, '') in ('alta','urgente','critica')
$$;

create or replace function public.os_diaria_tem_sst_liberado(p_os_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.apr
     where os_id = p_os_id
       and status in ('liberada','encerrada')
       and deleted_at is null
  )
  or exists (
    select 1 from public.apt
     where os_id = p_os_id
       and status in ('liberada','encerrada')
       and deleted_at is null
  )
$$;

create or replace function public.os_diaria_movimentar(
  p_user_id uuid,
  p_os_id uuid,
  p_acao text,
  p_checklist jsonb default '[]'::jsonb,
  p_materiais jsonb default '[]'::jsonb,
  p_observacao text default null
)
returns public.ordens_servico
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.usuarios;
  v_os public.ordens_servico;
  v_old_status text;
  v_new_status text;
  v_now timestamptz := now();
  v_exec jsonb;
  v_total_seconds integer := 0;
  v_last_start timestamptz;
  v_item jsonb;
  v_almox public.almoxarifado_itens;
  v_qty numeric(14,3);
  v_saldo_anterior numeric(14,3);
  v_saldo_posterior numeric(14,3);
begin
  select * into v_user from public.usuarios where id = p_user_id and ativo = true and deleted_at is null;
  if v_user.id is null or not public.is_os_diaria_user(p_user_id) then
    raise exception 'Usuario sem permissao para executar OS diaria.';
  end if;

  if p_acao not in ('iniciar','pausar','retomar','concluir') then
    raise exception 'Acao de execucao invalida.';
  end if;

  select * into v_os
    from public.ordens_servico
   where id = p_os_id
     and deleted_at is null
   for update;

  if v_os.id is null then
    raise exception 'OS nao encontrada.';
  end if;

  if v_user.perfil = 'tecnico' and v_os.responsavel_id is not null and v_os.responsavel_id <> p_user_id then
    raise exception 'OS atribuida a outro tecnico.';
  end if;

  if p_acao = 'concluir' and public.os_diaria_exige_sst(v_os) and not public.os_diaria_tem_sst_liberado(p_os_id) then
    raise exception 'Esta OS exige APR/APT liberada antes da conclusao.';
  end if;

  v_old_status := v_os.status;
  v_exec := coalesce(v_os.payload->'execucao_diaria', '{}'::jsonb);
  v_total_seconds := coalesce((v_exec->>'tempo_total_segundos')::integer, 0);
  v_last_start := nullif(v_exec->>'ultimo_inicio', '')::timestamptz;

  if p_acao = 'iniciar' then
    if v_old_status not in ('programada','encaminhada_tecnicos','pausada') then
      raise exception 'OS nao esta disponivel para inicio.';
    end if;
    v_new_status := 'em_execucao';
    if v_last_start is null then
      v_last_start := v_now;
    end if;
  elsif p_acao = 'pausar' then
    if v_old_status <> 'em_execucao' then
      raise exception 'Somente OS em execucao pode ser pausada.';
    end if;
    v_new_status := 'pausada';
    if v_last_start is not null then
      v_total_seconds := v_total_seconds + extract(epoch from (v_now - v_last_start))::integer;
    end if;
    v_last_start := null;
  elsif p_acao = 'retomar' then
    if v_old_status <> 'pausada' then
      raise exception 'Somente OS pausada pode ser retomada.';
    end if;
    v_new_status := 'em_execucao';
    v_last_start := v_now;
  else
    if v_old_status not in ('em_execucao','pausada') then
      raise exception 'Somente OS em execucao ou pausada pode ser concluida.';
    end if;
    v_new_status := 'concluida_tecnicos';
    if v_last_start is not null then
      v_total_seconds := v_total_seconds + extract(epoch from (v_now - v_last_start))::integer;
    end if;
    v_last_start := null;

    for v_item in select * from jsonb_array_elements(coalesce(p_materiais, '[]'::jsonb))
    loop
      if nullif(v_item->>'item_id', '') is not null then
        v_qty := coalesce(nullif(v_item->>'quantidade', '')::numeric, 0);
        if v_qty <= 0 then
          raise exception 'Quantidade de material deve ser maior que zero.';
        end if;

        select * into v_almox
          from public.almoxarifado_itens
         where id = (v_item->>'item_id')::uuid
           and deleted_at is null
           and ativo = true
         for update;

        if v_almox.id is null then
          raise exception 'Item de almoxarifado nao encontrado.';
        end if;

        v_saldo_anterior := v_almox.estoque_atual;
        v_saldo_posterior := v_saldo_anterior - v_qty;
        if v_saldo_posterior < 0 then
          raise exception 'Saldo insuficiente para %. Saldo atual: %', v_almox.nome, v_saldo_anterior;
        end if;

        update public.almoxarifado_itens
           set estoque_atual = v_saldo_posterior,
               updated_at = now()
         where id = v_almox.id;

        insert into public.movimentacoes_estoque (
          item_id, tipo, quantidade, saldo_anterior, saldo_posterior, origem, destino,
          os_id, solicitante_id, responsavel_id, observacao, created_by
        )
        values (
          v_almox.id, 'saida', v_qty, v_saldo_anterior, v_saldo_posterior,
          'almoxarifado', 'os_diaria', p_os_id, v_os.solicitante_id, p_user_id,
          'Material utilizado na OS diaria ' || v_os.numero, p_user_id
        );
      end if;
    end loop;
  end if;

  v_exec := jsonb_build_object(
    'ultimo_inicio', case when v_last_start is null then null else v_last_start end,
    'tempo_total_segundos', v_total_seconds,
    'checklist', coalesce(p_checklist, '[]'::jsonb),
    'materiais', coalesce(p_materiais, '[]'::jsonb),
    'ultima_acao', p_acao,
    'ultima_acao_em', v_now,
    'ultimo_usuario_id', p_user_id,
    'observacao', nullif(trim(coalesce(p_observacao, '')), '')
  );

  update public.ordens_servico
     set status = v_new_status,
         responsavel_id = coalesce(responsavel_id, p_user_id),
         inicio_execucao = case when p_acao in ('iniciar','retomar') and inicio_execucao is null then v_now else inicio_execucao end,
         fim_execucao = case when p_acao = 'concluir' then v_now else fim_execucao end,
         relatorio_tecnico = case when p_acao = 'concluir' then nullif(trim(coalesce(p_observacao, '')), '') else relatorio_tecnico end,
         materiais_utilizados = case when p_acao = 'concluir' then coalesce(p_materiais, '[]'::jsonb)::text else materiais_utilizados end,
         payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('execucao_diaria', v_exec),
         updated_at = now()
   where id = p_os_id
  returning * into v_os;

  insert into public.os_historico (os_id, usuario_id, acao, status_anterior, status_novo, descricao, metadata)
  values (
    p_os_id, p_user_id, 'os_diaria_' || p_acao, v_old_status, v_new_status,
    coalesce(nullif(trim(p_observacao), ''), 'Acao registrada no painel de OS Diarias.'),
    jsonb_build_object('checklist', p_checklist, 'materiais', p_materiais, 'tempo_total_segundos', v_total_seconds)
  );

  insert into public.auditoria (usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
  values (
    p_user_id, 'ordens_servico', p_os_id, 'update',
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', v_new_status, 'acao', p_acao, 'tempo_total_segundos', v_total_seconds)
  );

  if p_acao = 'concluir' then
    insert into public.notificacoes (
      usuario_id, perfil_destino, titulo, mensagem, tipo, entidade_tipo, entidade_id, modulo, prioridade, acao_url
    )
    values (
      v_os.solicitante_id,
      case when v_os.solicitante_id is null then 'supervisor' else null end,
      'OS diaria concluida',
      v_os.numero || ' foi concluida pelo tecnico e enviada para validacao.',
      'alerta',
      'ordem_servico',
      p_os_id,
      'os',
      case when v_os.prioridade = 'critica' then 'critica' when v_os.prioridade = 'alta' then 'alta' else 'normal' end,
      '/os/' || p_os_id
    );
  end if;

  return v_os;
end;
$$;

grant execute on function public.is_os_diaria_user(uuid) to anon, authenticated, service_role;
grant execute on function public.os_diaria_exige_sst(public.ordens_servico) to anon, authenticated, service_role;
grant execute on function public.os_diaria_tem_sst_liberado(uuid) to anon, authenticated, service_role;
grant execute on function public.os_diaria_movimentar(uuid, uuid, text, jsonb, jsonb, text) to anon, authenticated, service_role;
