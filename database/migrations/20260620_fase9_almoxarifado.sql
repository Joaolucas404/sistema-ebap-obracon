-- Fase 9 - Almoxarifado
-- Execute este arquivo antes do arquivo RLS complementar.

create index if not exists idx_almox_itens_ativo
  on public.almoxarifado_itens(ativo)
  where deleted_at is null;

create index if not exists idx_almox_itens_local
  on public.almoxarifado_itens(local_id)
  where deleted_at is null;

create index if not exists idx_almox_itens_estoque_minimo
  on public.almoxarifado_itens(estoque_atual, estoque_minimo)
  where deleted_at is null and ativo = true;

create index if not exists idx_movimentacoes_estoque_created_at
  on public.movimentacoes_estoque(created_at desc);

create or replace function public.is_almox_manager(p_user_id uuid)
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
      and u.perfil in ('almoxarifado','gerencia','diretoria')
  );
$$;

create or replace function public.almox_salvar_item(
  p_user_id uuid,
  p_item_id uuid,
  p_codigo text,
  p_nome text,
  p_categoria text,
  p_unidade text,
  p_local_id uuid,
  p_estoque_minimo numeric,
  p_custo_medio numeric,
  p_controlado boolean,
  p_ativo boolean
)
returns public.almoxarifado_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.almoxarifado_itens;
begin
  if not public.is_almox_manager(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar almoxarifado.';
  end if;

  if length(trim(coalesce(p_codigo, ''))) < 2 then
    raise exception 'Codigo do item e obrigatorio.';
  end if;

  if length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Nome do item deve possuir pelo menos 3 caracteres.';
  end if;

  if length(trim(coalesce(p_categoria, ''))) < 2 then
    raise exception 'Categoria do item e obrigatoria.';
  end if;

  if coalesce(p_estoque_minimo, 0) < 0 then
    raise exception 'Estoque minimo nao pode ser negativo.';
  end if;

  if p_item_id is null then
    insert into public.almoxarifado_itens (
      codigo,
      nome,
      categoria,
      unidade,
      local_id,
      estoque_atual,
      estoque_minimo,
      custo_medio,
      controlado,
      ativo
    )
    values (
      upper(trim(p_codigo)),
      trim(p_nome),
      trim(p_categoria),
      lower(trim(coalesce(nullif(p_unidade, ''), 'un'))),
      p_local_id,
      0,
      coalesce(p_estoque_minimo, 0),
      p_custo_medio,
      coalesce(p_controlado, false),
      coalesce(p_ativo, true)
    )
    returning * into v_item;
  else
    update public.almoxarifado_itens
       set codigo = upper(trim(p_codigo)),
           nome = trim(p_nome),
           categoria = trim(p_categoria),
           unidade = lower(trim(coalesce(nullif(p_unidade, ''), 'un'))),
           local_id = p_local_id,
           estoque_minimo = coalesce(p_estoque_minimo, 0),
           custo_medio = p_custo_medio,
           controlado = coalesce(p_controlado, false),
           ativo = coalesce(p_ativo, true),
           updated_at = now()
     where id = p_item_id
       and deleted_at is null
     returning * into v_item;

    if v_item.id is null then
      raise exception 'Item de almoxarifado nao encontrado.';
    end if;
  end if;

  return v_item;
end;
$$;

create or replace function public.almox_desativar_item(
  p_user_id uuid,
  p_item_id uuid
)
returns public.almoxarifado_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.almoxarifado_itens;
begin
  if not public.is_almox_manager(p_user_id) then
    raise exception 'Usuario sem permissao para desativar item de almoxarifado.';
  end if;

  update public.almoxarifado_itens
     set ativo = false,
         deleted_at = now(),
         deleted_by = p_user_id,
         updated_at = now()
   where id = p_item_id
     and deleted_at is null
   returning * into v_item;

  if v_item.id is null then
    raise exception 'Item de almoxarifado nao encontrado.';
  end if;

  return v_item;
end;
$$;

create or replace function public.registrar_movimentacao_estoque(
  p_user_id uuid,
  p_item_id uuid,
  p_tipo text,
  p_quantidade numeric,
  p_origem text default null,
  p_destino text default null,
  p_os_id uuid default null,
  p_solicitante_id uuid default null,
  p_observacao text default null
)
returns public.movimentacoes_estoque
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.almoxarifado_itens;
  v_saldo_anterior numeric(14,3);
  v_saldo_posterior numeric(14,3);
  v_mov public.movimentacoes_estoque;
begin
  if not public.is_almox_manager(p_user_id) then
    raise exception 'Usuario sem permissao para movimentar estoque.';
  end if;

  if p_tipo not in ('entrada','saida','ajuste','emprestimo','devolucao','transferencia') then
    raise exception 'Tipo de movimentacao invalido.';
  end if;

  if coalesce(p_quantidade, 0) <= 0 then
    raise exception 'Quantidade deve ser maior que zero.';
  end if;

  select *
    into v_item
    from public.almoxarifado_itens
   where id = p_item_id
     and deleted_at is null
     and ativo = true
   for update;

  if v_item.id is null then
    raise exception 'Item de almoxarifado nao encontrado ou inativo.';
  end if;

  v_saldo_anterior := v_item.estoque_atual;

  if p_tipo in ('saida','emprestimo','transferencia') then
    v_saldo_posterior := v_saldo_anterior - p_quantidade;
  else
    v_saldo_posterior := v_saldo_anterior + p_quantidade;
  end if;

  if v_saldo_posterior < 0 then
    raise exception 'Saldo insuficiente para movimentacao. Saldo atual: %', v_saldo_anterior;
  end if;

  update public.almoxarifado_itens
     set estoque_atual = v_saldo_posterior,
         updated_at = now()
   where id = p_item_id;

  insert into public.movimentacoes_estoque (
    item_id,
    tipo,
    quantidade,
    saldo_anterior,
    saldo_posterior,
    origem,
    destino,
    os_id,
    solicitante_id,
    responsavel_id,
    observacao,
    created_by
  )
  values (
    p_item_id,
    p_tipo,
    p_quantidade,
    v_saldo_anterior,
    v_saldo_posterior,
    nullif(trim(coalesce(p_origem, '')), ''),
    nullif(trim(coalesce(p_destino, '')), ''),
    p_os_id,
    p_solicitante_id,
    p_user_id,
    nullif(trim(coalesce(p_observacao, '')), ''),
    p_user_id
  )
  returning * into v_mov;

  return v_mov;
end;
$$;

grant execute on function public.is_almox_manager(uuid) to anon, authenticated, service_role;
grant execute on function public.almox_salvar_item(uuid, uuid, text, text, text, text, uuid, numeric, numeric, boolean, boolean) to anon, authenticated, service_role;
grant execute on function public.almox_desativar_item(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.registrar_movimentacao_estoque(uuid, uuid, text, numeric, text, text, uuid, uuid, text) to anon, authenticated, service_role;
