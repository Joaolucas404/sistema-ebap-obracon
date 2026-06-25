alter table public.perfis enable row level security;
alter table public.permissoes enable row level security;
alter table public.perfil_permissoes enable row level security;
alter table public.usuarios enable row level security;
alter table public.ebaps enable row level security;
alter table public.supervisor_areas enable row level security;
alter table public.equipamento_tipos enable row level security;
alter table public.equipamentos enable row level security;
alter table public.relatorios_diarios enable row level security;
alter table public.relatorio_diario_secoes enable row level security;
alter table public.relatorio_diario_itens enable row level security;
alter table public.validacoes_cco enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.os_historico enable row level security;
alter table public.modelos_relatorio enable row level security;
alter table public.campos_relatorio enable row level security;
alter table public.respostas_relatorio enable row level security;
alter table public.comentarios enable row level security;
alter table public.anexos enable row level security;
alter table public.arquivo_pdf enable row level security;
alter table public.archive_documents enable row level security;
alter table public.almoxarifado_locais enable row level security;
alter table public.almoxarifado_itens enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.compras enable row level security;
alter table public.compra_aprovacoes enable row level security;
alter table public.fornecedores enable row level security;
alter table public.contratos enable row level security;
alter table public.financeiro_lancamentos enable row level security;
alter table public.medicoes enable row level security;
alter table public.sst_colaboradores enable row level security;
alter table public.sst_apr enable row level security;
alter table public.sst_epi enable row level security;
alter table public.sst_epi_entregas enable row level security;
alter table public.sst_treinamentos enable row level security;
alter table public.sst_treinamento_colaboradores enable row level security;
alter table public.sst_inspecoes enable row level security;
alter table public.sst_ocorrencias enable row level security;
alter table public.sst_planos_acao enable row level security;
alter table public.notificacoes enable row level security;
alter table public.auditoria enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.perfil', true), ''), nullif(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('diretoria','gerencia','service_role')
$$;

create or replace function public.can_read_operational()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('anon','operador','tecnico','cco','supervisor','gerencia','diretoria','prefeitura','sst','administrativo','almoxarifado','financeiro','service_role')
$$;

create policy "perfis_read_operational" on public.perfis for select using (public.can_read_operational() or public.current_app_role() = 'anon');
create policy "permissoes_read_operational" on public.permissoes for select using (public.can_read_operational());
create policy "perfil_permissoes_read_operational" on public.perfil_permissoes for select using (public.can_read_operational());

create policy "usuarios_login_read" on public.usuarios for select using (deleted_at is null);
create policy "usuarios_diretoria_insert" on public.usuarios for insert with check (public.current_app_role() in ('diretoria','service_role') or public.current_app_role() = 'anon');
create policy "usuarios_diretoria_update" on public.usuarios for update using (public.current_app_role() in ('diretoria','service_role') or public.current_app_role() = 'anon') with check (true);

create policy "ebaps_read_all_profiles" on public.ebaps for select using (deleted_at is null and public.can_read_operational());
create policy "ebaps_admin_write" on public.ebaps for all using (public.is_admin_role()) with check (public.is_admin_role());
create policy "supervisor_areas_read_operational" on public.supervisor_areas for select using (deleted_at is null and public.can_read_operational());
create policy "supervisor_areas_admin_write" on public.supervisor_areas for all using (public.current_app_role() in ('anon','gerencia','diretoria','service_role')) with check (true);
create policy "equipamento_tipos_read_all_profiles" on public.equipamento_tipos for select using (public.can_read_operational());
create policy "equipamento_tipos_admin_write" on public.equipamento_tipos for all using (public.is_admin_role()) with check (public.is_admin_role());
create policy "equipamentos_read_all_profiles" on public.equipamentos for select using (deleted_at is null and public.can_read_operational());
create policy "equipamentos_admin_write" on public.equipamentos for all using (public.current_app_role() in ('supervisor','gerencia','diretoria','service_role')) with check (true);

create policy "relatorios_read_profiles" on public.relatorios_diarios for select using (deleted_at is null and public.can_read_operational());
create policy "relatorios_operador_insert" on public.relatorios_diarios for insert with check (public.current_app_role() in ('anon','operador','supervisor','gerencia','diretoria','service_role'));
create policy "relatorios_operador_update" on public.relatorios_diarios for update using (public.current_app_role() in ('anon','operador','cco','supervisor','gerencia','diretoria','service_role')) with check (true);
create policy "relatorio_secoes_rw" on public.relatorio_diario_secoes for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "relatorio_itens_rw" on public.relatorio_diario_itens for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "validacoes_cco_rw" on public.validacoes_cco for all using (public.current_app_role() in ('anon','cco','supervisor','gerencia','diretoria','service_role')) with check (true);

create policy "os_read_profiles" on public.ordens_servico for select using (deleted_at is null and public.can_read_operational());
create policy "os_insert_profiles" on public.ordens_servico for insert with check (public.current_app_role() in ('anon','operador','prefeitura','cco','supervisor','gerencia','diretoria','service_role'));
create policy "os_update_profiles" on public.ordens_servico for update using (public.current_app_role() in ('anon','tecnico','cco','supervisor','gerencia','diretoria','prefeitura','service_role')) with check (true);
create policy "os_historico_read_profiles" on public.os_historico for select using (public.can_read_operational());
create policy "os_historico_insert_profiles" on public.os_historico for insert with check (public.can_read_operational());
create policy "modelos_relatorio_read" on public.modelos_relatorio for select using (deleted_at is null and public.can_read_operational());
create policy "modelos_relatorio_admin" on public.modelos_relatorio for all using (public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role')) with check (true);
create policy "campos_relatorio_read" on public.campos_relatorio for select using (public.can_read_operational());
create policy "campos_relatorio_admin" on public.campos_relatorio for all using (public.current_app_role() in ('anon','supervisor','gerencia','diretoria','service_role')) with check (true);
create policy "respostas_relatorio_read" on public.respostas_relatorio for select using (deleted_at is null and public.can_read_operational());
create policy "respostas_relatorio_write" on public.respostas_relatorio for all using (public.current_app_role() in ('anon','tecnico','supervisor','gerencia','diretoria','service_role')) with check (true);

create policy "comentarios_rw_profiles" on public.comentarios for all using (deleted_at is null and public.can_read_operational()) with check (public.can_read_operational());
create policy "anexos_rw_profiles" on public.anexos for all using (deleted_at is null and public.can_read_operational()) with check (public.can_read_operational());
create policy "arquivo_pdf_read_profiles" on public.arquivo_pdf for select using (deleted_at is null and public.can_read_operational());
create policy "arquivo_pdf_write_profiles" on public.arquivo_pdf for all using (public.current_app_role() in ('cco','supervisor','gerencia','diretoria','financeiro','administrativo','service_role')) with check (true);
create policy "archive_documents_read_profiles" on public.archive_documents for select using (deleted_at is null and public.can_read_operational());
create policy "archive_documents_write_profiles" on public.archive_documents for all using (public.can_read_operational()) with check (public.can_read_operational());

create policy "almox_read_profiles" on public.almoxarifado_itens for select using (deleted_at is null and public.current_app_role() in ('almoxarifado','supervisor','gerencia','diretoria','administrativo','sst','financeiro','service_role'));
create policy "almox_write_profiles" on public.almoxarifado_itens for all using (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role')) with check (true);
create policy "almox_locais_rw" on public.almoxarifado_locais for all using (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role')) with check (true);
create policy "movimentacoes_read_profiles" on public.movimentacoes_estoque for select using (public.current_app_role() in ('almoxarifado','supervisor','gerencia','diretoria','administrativo','financeiro','service_role'));
create policy "movimentacoes_write_profiles" on public.movimentacoes_estoque for insert with check (public.current_app_role() in ('almoxarifado','gerencia','diretoria','service_role'));

create policy "compras_read_profiles" on public.compras for select using (deleted_at is null and public.current_app_role() in ('almoxarifado','administrativo','financeiro','supervisor','gerencia','diretoria','sst','service_role'));
create policy "compras_write_profiles" on public.compras for all using (public.current_app_role() in ('almoxarifado','administrativo','financeiro','gerencia','diretoria','sst','service_role')) with check (true);
create policy "compra_aprovacoes_rw" on public.compra_aprovacoes for all using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')) with check (true);

create policy "financeiro_read_profiles" on public.financeiro_lancamentos for select using (public.current_app_role() in ('financeiro','administrativo','gerencia','diretoria','prefeitura','service_role'));
create policy "financeiro_write_profiles" on public.financeiro_lancamentos for all using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')) with check (true);
create policy "contratos_read_profiles" on public.contratos for select using (deleted_at is null and public.current_app_role() in ('financeiro','administrativo','gerencia','diretoria','prefeitura','service_role'));
create policy "contratos_write_profiles" on public.contratos for all using (public.current_app_role() in ('financeiro','administrativo','gerencia','diretoria','service_role')) with check (true);
create policy "fornecedores_rw_profiles" on public.fornecedores for all using (public.current_app_role() in ('financeiro','administrativo','gerencia','diretoria','service_role')) with check (true);
create policy "medicoes_read_profiles" on public.medicoes for select using (deleted_at is null and public.current_app_role() in ('financeiro','administrativo','gerencia','diretoria','prefeitura','service_role'));
create policy "medicoes_write_profiles" on public.medicoes for all using (public.current_app_role() in ('financeiro','gerencia','diretoria','service_role')) with check (true);

create policy "sst_read_profiles" on public.sst_colaboradores for select using (deleted_at is null and public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role'));
create policy "sst_write_profiles" on public.sst_colaboradores for all using (public.current_app_role() in ('sst','gerencia','diretoria','service_role')) with check (true);
create policy "sst_apr_rw_profiles" on public.sst_apr for all using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','tecnico','service_role')) with check (true);
create policy "sst_epi_rw_profiles" on public.sst_epi for all using (public.current_app_role() in ('sst','almoxarifado','gerencia','diretoria','service_role')) with check (true);
create policy "sst_epi_entregas_rw_profiles" on public.sst_epi_entregas for all using (public.current_app_role() in ('sst','almoxarifado','gerencia','diretoria','service_role')) with check (true);
create policy "sst_treinamentos_rw_profiles" on public.sst_treinamentos for all using (public.current_app_role() in ('sst','gerencia','diretoria','service_role')) with check (true);
create policy "sst_treinamento_colaboradores_rw_profiles" on public.sst_treinamento_colaboradores for all using (public.current_app_role() in ('sst','gerencia','diretoria','service_role')) with check (true);
create policy "sst_inspecoes_rw_profiles" on public.sst_inspecoes for all using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role')) with check (true);
create policy "sst_ocorrencias_rw_profiles" on public.sst_ocorrencias for all using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role')) with check (true);
create policy "sst_planos_acao_rw_profiles" on public.sst_planos_acao for all using (public.current_app_role() in ('sst','supervisor','gerencia','diretoria','service_role')) with check (true);

create policy "notificacoes_usuario_read" on public.notificacoes for select using (usuario_id = public.current_app_user_id() or perfil_destino = public.current_app_role() or public.is_admin_role());
create policy "notificacoes_insert_system" on public.notificacoes for insert with check (public.can_read_operational());
create policy "notificacoes_update_owner" on public.notificacoes for update using (usuario_id = public.current_app_user_id() or public.is_admin_role()) with check (true);
create policy "auditoria_admin_read" on public.auditoria for select using (public.is_admin_role());
create policy "auditoria_insert_system" on public.auditoria for insert with check (true);

create or replace function public.soft_delete_usuario_diretoria(
  p_usuario_alvo_id uuid,
  p_usuario_executor_id uuid
)
returns table (
  id uuid,
  usuario text,
  nome text,
  perfil text,
  setor text,
  ativo boolean,
  ultimo_login timestamptz,
  criado_por uuid,
  criado_em timestamptz,
  atualizado_em timestamptz,
  deleted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  executor_perfil text;
begin
  select u.perfil
    into executor_perfil
  from public.usuarios u
  where u.id = p_usuario_executor_id
    and u.deleted_at is null
    and u.ativo = true;

  if executor_perfil <> 'diretoria' then
    raise exception 'Apenas Diretoria pode excluir usuários.';
  end if;

  if p_usuario_alvo_id = p_usuario_executor_id then
    raise exception 'Você não pode excluir o próprio usuário logado.';
  end if;

  return query
  update public.usuarios u
     set ativo = false,
         deleted_at = now(),
         deleted_by = p_usuario_executor_id,
         atualizado_em = now()
   where u.id = p_usuario_alvo_id
     and u.deleted_at is null
  returning u.id, u.usuario, u.nome, u.perfil, u.setor, u.ativo, u.ultimo_login, u.criado_por, u.criado_em, u.atualizado_em, u.deleted_at;
end;
$$;

create or replace function public.soft_delete_os_diretoria(
  p_os_id uuid,
  p_usuario_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  executor_perfil text;
  status_atual text;
begin
  select u.perfil
    into executor_perfil
  from public.usuarios u
  where u.id = p_usuario_id
    and u.deleted_at is null
    and u.ativo = true;

  if executor_perfil <> 'diretoria' then
    raise exception 'Apenas Diretoria pode excluir OS.';
  end if;

  select os.status
    into status_atual
  from public.ordens_servico os
  where os.id = p_os_id
    and os.deleted_at is null;

  if status_atual is null then
    raise exception 'OS não encontrada ou já excluída.';
  end if;

  update public.ordens_servico
     set deleted_at = now(),
         deleted_by = p_usuario_id
   where id = p_os_id;

  insert into public.os_historico (
    os_id,
    usuario_id,
    acao,
    status_anterior,
    status_novo,
    descricao,
    metadata
  )
  values (
    p_os_id,
    p_usuario_id,
    'excluida',
    status_atual,
    status_atual,
    'OS excluída logicamente pela Diretoria.',
    jsonb_build_object('deleted_at', now())
  );
end;
$$;
