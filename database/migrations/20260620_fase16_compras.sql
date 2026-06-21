alter table public.compras
  add column if not exists area text,
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null,
  add column if not exists data_cotacao timestamptz,
  add column if not exists data_aprovacao timestamptz,
  add column if not exists data_compra timestamptz,
  add column if not exists data_recebimento timestamptz,
  add column if not exists valor_total numeric(14,2) not null default 0,
  add column if not exists motivo_reprovacao text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.fornecedores
  add column if not exists razao_social text,
  add column if not exists endereco text,
  add column if not exists cidade text,
  add column if not exists uf text,
  add column if not exists cep text,
  add column if not exists observacoes text,
  add column if not exists created_by uuid references public.usuarios(id) on delete set null,
  add column if not exists deleted_by uuid references public.usuarios(id) on delete set null;

do $$
begin
  alter table public.compras drop constraint if exists compras_status_check;
  alter table public.compras
    add constraint compras_status_check
    check (status in (
      'rascunho','enviada','gerencia_1','gerencia_2','financeiro','liberada','comprada','recebida','cancelada',
      'solicitada','em_cotacao','aguardando_aprovacao','aprovada','reprovada'
    ));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.compras drop constraint if exists compras_prioridade_check;
  alter table public.compras
    add constraint compras_prioridade_check
    check (prioridade in ('baixa','normal','media','alta','urgente','critica'));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.compra_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  almox_item_id uuid references public.almoxarifado_itens(id) on delete set null,
  descricao text not null,
  categoria text,
  unidade text not null default 'un',
  quantidade numeric(14,3) not null check (quantidade > 0),
  valor_unitario numeric(14,2) not null default 0 check (valor_unitario >= 0),
  valor_total numeric(14,2) generated always as (round((quantidade * valor_unitario)::numeric, 2)) stored,
  recebido boolean not null default false,
  recebido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compra_cotacoes (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  valor_total numeric(14,2) not null default 0 check (valor_total >= 0),
  prazo_entrega date,
  condicao_pagamento text,
  observacoes text,
  selecionada boolean not null default false,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compra_historico (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  acao text not null,
  status_anterior text,
  status_novo text,
  descricao text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_compras_status on public.compras(status) where deleted_at is null;
create index if not exists idx_compras_area on public.compras(area) where deleted_at is null;
create index if not exists idx_compras_ebap on public.compras(ebap_id) where deleted_at is null;
create index if not exists idx_compras_solicitante on public.compras(solicitante_id) where deleted_at is null;
create index if not exists idx_compra_itens_compra on public.compra_itens(compra_id);
create index if not exists idx_compra_itens_almox_item on public.compra_itens(almox_item_id);
create index if not exists idx_compra_cotacoes_compra on public.compra_cotacoes(compra_id);
create index if not exists idx_compra_historico_compra on public.compra_historico(compra_id, created_at desc);
create index if not exists idx_fornecedores_nome on public.fornecedores(nome) where deleted_at is null;

create or replace function public.is_compras_user(p_user_id uuid)
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
       and perfil in ('almoxarifado','financeiro','supervisor','gerencia','diretoria')
  );
$$;

create or replace function public.is_compras_approver(p_user_id uuid)
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
       and perfil in ('gerencia','diretoria')
  );
$$;

create or replace function public.compras_recalcular_total(p_compra_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(14,2);
begin
  select coalesce(sum(valor_total), 0)
    into v_total
    from public.compra_itens
   where compra_id = p_compra_id;

  update public.compras
     set valor_total = v_total,
         valor_estimado = v_total,
         updated_at = now()
   where id = p_compra_id;

  return v_total;
end;
$$;

create or replace function public.compras_registrar_historico(
  p_compra_id uuid,
  p_user_id uuid,
  p_acao text,
  p_status_anterior text,
  p_status_novo text,
  p_descricao text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.compra_historico
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hist public.compra_historico;
begin
  insert into public.compra_historico (
    compra_id, usuario_id, acao, status_anterior, status_novo, descricao, metadata
  )
  values (
    p_compra_id, p_user_id, p_acao, p_status_anterior, p_status_novo,
    nullif(trim(coalesce(p_descricao, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_hist;

  insert into public.auditoria (usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
  values (
    p_user_id,
    'compras',
    p_compra_id,
    case when p_acao in ('approve') then 'approve' when p_acao in ('reject') then 'reject' else 'update' end,
    jsonb_build_object('status', p_status_anterior),
    jsonb_build_object('status', p_status_novo, 'acao', p_acao)
  );

  return v_hist;
end;
$$;

create or replace function public.compras_salvar_solicitacao(
  p_user_id uuid,
  p_compra_id uuid,
  p_numero text,
  p_area text,
  p_ebap_id uuid,
  p_justificativa text,
  p_prioridade text,
  p_prazo_necessario date,
  p_itens jsonb
)
returns public.compras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra public.compras;
  v_old_status text;
  v_numero text;
  v_item jsonb;
begin
  if not public.is_compras_user(p_user_id) then
    raise exception 'Usuario sem permissao para solicitar compra.';
  end if;

  if nullif(trim(coalesce(p_area, '')), '') is null then
    raise exception 'Informe a area da solicitacao.';
  end if;

  if nullif(trim(coalesce(p_justificativa, '')), '') is null or length(trim(p_justificativa)) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.';
  end if;

  if jsonb_typeof(coalesce(p_itens, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) = 0 then
    raise exception 'Informe pelo menos um material.';
  end if;

  v_numero := coalesce(nullif(trim(p_numero), ''), 'SC-' || to_char(now(), 'YYYYMMDDHH24MISSMS'));

  if p_compra_id is null then
    insert into public.compras (
      numero, solicitante_id, area, ebap_id, justificativa, prioridade, prazo_necessario,
      status, item_descricao, quantidade, valor_estimado, valor_total, created_by
    )
    values (
      upper(v_numero), p_user_id, trim(p_area), p_ebap_id, trim(p_justificativa),
      coalesce(p_prioridade, 'normal'), p_prazo_necessario, 'solicitada',
      'Solicitacao com itens detalhados', 1, 0, 0, p_user_id
    )
    returning * into v_compra;

    v_old_status := null;
  else
    select status into v_old_status from public.compras where id = p_compra_id and deleted_at is null for update;

    if v_old_status is null then
      raise exception 'Solicitacao de compra nao encontrada.';
    end if;

    update public.compras
       set numero = upper(v_numero),
           area = trim(p_area),
           ebap_id = p_ebap_id,
           justificativa = trim(p_justificativa),
           prioridade = coalesce(p_prioridade, prioridade),
           prazo_necessario = p_prazo_necessario,
           updated_at = now()
     where id = p_compra_id
    returning * into v_compra;

    delete from public.compra_itens where compra_id = v_compra.id;
  end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    if nullif(trim(coalesce(v_item->>'descricao', '')), '') is null then
      raise exception 'Descricao do material e obrigatoria.';
    end if;

    if coalesce((v_item->>'quantidade')::numeric, 0) <= 0 then
      raise exception 'Quantidade do material deve ser maior que zero.';
    end if;

    insert into public.compra_itens (
      compra_id, almox_item_id, descricao, categoria, unidade, quantidade, valor_unitario
    )
    values (
      v_compra.id,
      nullif(v_item->>'almox_item_id', '')::uuid,
      trim(v_item->>'descricao'),
      nullif(trim(coalesce(v_item->>'categoria', '')), ''),
      coalesce(nullif(trim(coalesce(v_item->>'unidade', '')), ''), 'un'),
      (v_item->>'quantidade')::numeric,
      coalesce(nullif(v_item->>'valor_unitario', '')::numeric, 0)
    );
  end loop;

  perform public.compras_recalcular_total(v_compra.id);

  select * into v_compra from public.compras where id = v_compra.id;

  perform public.compras_registrar_historico(
    v_compra.id,
    p_user_id,
    case when p_compra_id is null then 'solicitada' else 'atualizada' end,
    v_old_status,
    v_compra.status,
    case when p_compra_id is null then 'Solicitacao de compra criada.' else 'Solicitacao de compra atualizada.' end,
    jsonb_build_object('itens', p_itens)
  );

  return v_compra;
end;
$$;

create or replace function public.compras_mudar_status(
  p_user_id uuid,
  p_compra_id uuid,
  p_status text,
  p_descricao text default null,
  p_fornecedor_id uuid default null
)
returns public.compras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra public.compras;
  v_old_status text;
begin
  if not public.is_compras_user(p_user_id) then
    raise exception 'Usuario sem permissao para movimentar compras.';
  end if;

  if p_status not in ('solicitada','em_cotacao','aguardando_aprovacao','aprovada','comprada','recebida','cancelada') then
    raise exception 'Status de compra invalido.';
  end if;

  select * into v_compra from public.compras where id = p_compra_id and deleted_at is null for update;
  if v_compra.id is null then
    raise exception 'Solicitacao de compra nao encontrada.';
  end if;

  v_old_status := v_compra.status;

  update public.compras
     set status = p_status,
         fornecedor_id = coalesce(p_fornecedor_id, fornecedor_id),
         data_cotacao = case when p_status = 'em_cotacao' then now() else data_cotacao end,
         data_compra = case when p_status = 'comprada' then now() else data_compra end,
         updated_at = now()
   where id = p_compra_id
  returning * into v_compra;

  perform public.compras_registrar_historico(
    p_compra_id,
    p_user_id,
    'status',
    v_old_status,
    p_status,
    coalesce(p_descricao, 'Status da solicitacao atualizado.'),
    jsonb_build_object('fornecedor_id', p_fornecedor_id)
  );

  return v_compra;
end;
$$;

create or replace function public.compras_aprovar(
  p_user_id uuid,
  p_compra_id uuid,
  p_aprovado boolean,
  p_parecer text
)
returns public.compras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra public.compras;
  v_old_status text;
  v_etapa text;
begin
  if not public.is_compras_approver(p_user_id) then
    raise exception 'Somente Gerencia ou Diretoria podem aprovar compras.';
  end if;

  if p_aprovado is false and (nullif(trim(coalesce(p_parecer, '')), '') is null or length(trim(p_parecer)) < 5) then
    raise exception 'Motivo da reprovacao e obrigatorio.';
  end if;

  select * into v_compra from public.compras where id = p_compra_id and deleted_at is null for update;
  if v_compra.id is null then
    raise exception 'Solicitacao de compra nao encontrada.';
  end if;

  v_old_status := v_compra.status;
  v_etapa := case
    when exists (select 1 from public.usuarios where id = p_user_id and perfil = 'diretoria') then 'gerencia_2'
    else 'gerencia_1'
  end;

  insert into public.compra_aprovacoes (compra_id, etapa, aprovador_id, status, parecer, aprovado_em)
  values (
    p_compra_id,
    v_etapa,
    p_user_id,
    case when p_aprovado then 'aprovado' else 'reprovado' end,
    nullif(trim(coalesce(p_parecer, '')), ''),
    now()
  )
  on conflict (compra_id, etapa)
  do update set
    aprovador_id = excluded.aprovador_id,
    status = excluded.status,
    parecer = excluded.parecer,
    aprovado_em = excluded.aprovado_em,
    updated_at = now();

  update public.compras
     set status = case when p_aprovado then 'aprovada' else 'reprovada' end,
         data_aprovacao = case when p_aprovado then now() else data_aprovacao end,
         motivo_reprovacao = case when p_aprovado then null else trim(p_parecer) end,
         updated_at = now()
   where id = p_compra_id
  returning * into v_compra;

  perform public.compras_registrar_historico(
    p_compra_id,
    p_user_id,
    case when p_aprovado then 'approve' else 'reject' end,
    v_old_status,
    v_compra.status,
    case when p_aprovado then 'Solicitacao aprovada.' else 'Solicitacao reprovada.' end,
    jsonb_build_object('parecer', p_parecer, 'etapa', v_etapa)
  );

  return v_compra;
end;
$$;

create or replace function public.compras_salvar_fornecedor(
  p_user_id uuid,
  p_fornecedor_id uuid,
  p_nome text,
  p_razao_social text,
  p_documento text,
  p_email text,
  p_telefone text,
  p_contato text,
  p_endereco text,
  p_cidade text,
  p_uf text,
  p_cep text,
  p_observacoes text,
  p_ativo boolean
)
returns public.fornecedores
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fornecedor public.fornecedores;
begin
  if not public.is_compras_user(p_user_id) then
    raise exception 'Usuario sem permissao para gerenciar fornecedores.';
  end if;

  if nullif(trim(coalesce(p_nome, '')), '') is null or length(trim(p_nome)) < 3 then
    raise exception 'Informe o nome do fornecedor.';
  end if;

  if p_fornecedor_id is null then
    insert into public.fornecedores (
      nome, razao_social, documento, email, telefone, contato, endereco, cidade, uf, cep,
      observacoes, ativo, created_by
    )
    values (
      trim(p_nome), nullif(trim(coalesce(p_razao_social, '')), ''), nullif(trim(coalesce(p_documento, '')), ''),
      nullif(trim(coalesce(p_email, '')), ''), nullif(trim(coalesce(p_telefone, '')), ''),
      nullif(trim(coalesce(p_contato, '')), ''), nullif(trim(coalesce(p_endereco, '')), ''),
      nullif(trim(coalesce(p_cidade, '')), ''), nullif(upper(trim(coalesce(p_uf, ''))), ''),
      nullif(trim(coalesce(p_cep, '')), ''), nullif(trim(coalesce(p_observacoes, '')), ''),
      coalesce(p_ativo, true), p_user_id
    )
    returning * into v_fornecedor;
  else
    update public.fornecedores
       set nome = trim(p_nome),
           razao_social = nullif(trim(coalesce(p_razao_social, '')), ''),
           documento = nullif(trim(coalesce(p_documento, '')), ''),
           email = nullif(trim(coalesce(p_email, '')), ''),
           telefone = nullif(trim(coalesce(p_telefone, '')), ''),
           contato = nullif(trim(coalesce(p_contato, '')), ''),
           endereco = nullif(trim(coalesce(p_endereco, '')), ''),
           cidade = nullif(trim(coalesce(p_cidade, '')), ''),
           uf = nullif(upper(trim(coalesce(p_uf, ''))), ''),
           cep = nullif(trim(coalesce(p_cep, '')), ''),
           observacoes = nullif(trim(coalesce(p_observacoes, '')), ''),
           ativo = coalesce(p_ativo, true),
           updated_at = now()
     where id = p_fornecedor_id
       and deleted_at is null
    returning * into v_fornecedor;
  end if;

  if v_fornecedor.id is null then
    raise exception 'Fornecedor nao encontrado.';
  end if;

  return v_fornecedor;
end;
$$;

create or replace function public.compras_receber(
  p_user_id uuid,
  p_compra_id uuid,
  p_observacao text default null
)
returns public.compras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra public.compras;
  v_old_status text;
  v_item public.compra_itens;
  v_almox public.almoxarifado_itens;
  v_saldo_anterior numeric(14,3);
  v_saldo_posterior numeric(14,3);
begin
  if not public.is_compras_user(p_user_id) then
    raise exception 'Usuario sem permissao para receber compras.';
  end if;

  select * into v_compra from public.compras where id = p_compra_id and deleted_at is null for update;
  if v_compra.id is null then
    raise exception 'Solicitacao de compra nao encontrada.';
  end if;

  v_old_status := v_compra.status;

  for v_item in
    select * from public.compra_itens where compra_id = p_compra_id and recebido = false
  loop
    if v_item.almox_item_id is not null then
      select *
        into v_almox
        from public.almoxarifado_itens
       where id = v_item.almox_item_id
         and deleted_at is null
         and ativo = true
       for update;

      if v_almox.id is null then
        raise exception 'Item de almoxarifado nao encontrado para recebimento.';
      end if;

      v_saldo_anterior := v_almox.estoque_atual;
      v_saldo_posterior := v_saldo_anterior + v_item.quantidade;

      update public.almoxarifado_itens
         set estoque_atual = v_saldo_posterior,
             updated_at = now()
       where id = v_item.almox_item_id;

      insert into public.movimentacoes_estoque (
        item_id, tipo, quantidade, saldo_anterior, saldo_posterior, origem, destino,
        solicitante_id, responsavel_id, observacao, created_by
      )
      values (
        v_item.almox_item_id,
        'entrada',
        v_item.quantidade,
        v_saldo_anterior,
        v_saldo_posterior,
        'compras',
        'almoxarifado',
        v_compra.solicitante_id,
        p_user_id,
        'Recebimento da compra ' || v_compra.numero || coalesce(' - ' || nullif(trim(p_observacao), ''), ''),
        p_user_id
      );
    end if;

    update public.compra_itens
       set recebido = true,
           recebido_em = now(),
           updated_at = now()
     where id = v_item.id;
  end loop;

  update public.compras
     set status = 'recebida',
         data_recebimento = now(),
         updated_at = now()
   where id = p_compra_id
  returning * into v_compra;

  perform public.compras_registrar_historico(
    p_compra_id,
    p_user_id,
    'recebimento',
    v_old_status,
    'recebida',
    coalesce(p_observacao, 'Compra recebida e estoque atualizado.'),
    '{}'::jsonb
  );

  return v_compra;
end;
$$;

grant execute on function public.is_compras_user(uuid) to anon, authenticated, service_role;
grant execute on function public.is_compras_approver(uuid) to anon, authenticated, service_role;
grant execute on function public.compras_recalcular_total(uuid) to anon, authenticated, service_role;
grant execute on function public.compras_registrar_historico(uuid, uuid, text, text, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.compras_salvar_solicitacao(uuid, uuid, text, text, uuid, text, text, date, jsonb) to anon, authenticated, service_role;
grant execute on function public.compras_mudar_status(uuid, uuid, text, text, uuid) to anon, authenticated, service_role;
grant execute on function public.compras_aprovar(uuid, uuid, boolean, text) to anon, authenticated, service_role;
grant execute on function public.compras_salvar_fornecedor(uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, boolean) to anon, authenticated, service_role;
grant execute on function public.compras_receber(uuid, uuid, text) to anon, authenticated, service_role;
