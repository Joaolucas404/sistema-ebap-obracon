alter table public.notificacoes
  add column if not exists modulo text,
  add column if not exists prioridade text not null default 'normal',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists acao_url text;

do $$
begin
  alter table public.notificacoes drop constraint if exists notificacoes_prioridade_check;
  alter table public.notificacoes
    add constraint notificacoes_prioridade_check
    check (prioridade in ('baixa','normal','alta','critica'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_notificacoes_usuario_lida
  on public.notificacoes(usuario_id, lida_em, created_at desc);

create index if not exists idx_notificacoes_perfil_lida
  on public.notificacoes(perfil_destino, lida_em, created_at desc);

create index if not exists idx_notificacoes_modulo
  on public.notificacoes(modulo, created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.notificacoes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create or replace function public.notificacao_visivel_para_usuario(p_notificacao public.notificacoes, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.usuarios u
     where u.id = p_user_id
       and u.ativo = true
       and u.deleted_at is null
       and (
         p_notificacao.usuario_id = u.id
         or p_notificacao.perfil_destino = u.perfil
         or u.perfil = 'diretoria'
       )
  );
$$;

create or replace function public.marcar_notificacao_lida(
  p_user_id uuid,
  p_notificacao_id uuid
)
returns public.notificacoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notificacao public.notificacoes;
begin
  select *
    into v_notificacao
    from public.notificacoes
   where id = p_notificacao_id
   for update;

  if v_notificacao.id is null then
    raise exception 'Notificacao nao encontrada.';
  end if;

  if not public.notificacao_visivel_para_usuario(v_notificacao, p_user_id) then
    raise exception 'Usuario sem permissao para ler esta notificacao.';
  end if;

  update public.notificacoes
     set lida_em = coalesce(lida_em, now())
   where id = p_notificacao_id
  returning * into v_notificacao;

  insert into public.auditoria (usuario_id, tabela, registro_id, acao, dados_novos)
  values (
    p_user_id,
    'notificacoes',
    p_notificacao_id,
    'update',
    jsonb_build_object('acao', 'marcar_lida', 'lida_em', v_notificacao.lida_em)
  );

  return v_notificacao;
end;
$$;

create or replace function public.marcar_todas_notificacoes_lidas(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with visiveis as (
    select n.id
      from public.notificacoes n
     where n.lida_em is null
       and public.notificacao_visivel_para_usuario(n, p_user_id)
  ),
  atualizadas as (
    update public.notificacoes n
       set lida_em = now()
      from visiveis v
     where n.id = v.id
    returning n.id
  )
  select count(*) into v_count from atualizadas;

  insert into public.auditoria (usuario_id, tabela, acao, dados_novos)
  values (
    p_user_id,
    'notificacoes',
    'update',
    jsonb_build_object('acao', 'marcar_todas_lidas', 'quantidade', v_count)
  );

  return v_count;
end;
$$;

grant execute on function public.notificacao_visivel_para_usuario(public.notificacoes, uuid) to anon, authenticated, service_role;
grant execute on function public.marcar_notificacao_lida(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.marcar_todas_notificacoes_lidas(uuid) to anon, authenticated, service_role;
