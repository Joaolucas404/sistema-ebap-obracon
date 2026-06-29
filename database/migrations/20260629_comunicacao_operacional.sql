create table if not exists public.comunicacao_perfis (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  foto_url text,
  cargo text,
  equipe text,
  area text,
  status_manual text default 'offline' check (status_manual in ('online','ausente','offline')),
  updated_at timestamptz not null default now()
);

create table if not exists public.comunicacao_conversas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'grupo' check (tipo in ('direta','grupo')),
  nome text not null,
  descricao text,
  equipe text,
  area text,
  avatar_url text,
  criado_por uuid references public.usuarios(id) on delete set null,
  ativo boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.comunicacao_membros (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.comunicacao_conversas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  perfil text,
  equipe text,
  area text,
  papel text not null default 'membro' check (papel in ('admin','membro')),
  silenciado boolean not null default false,
  entrou_em timestamptz not null default now(),
  saiu_em timestamptz,
  unique (conversa_id, usuario_id)
);

create table if not exists public.comunicacao_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.comunicacao_conversas(id) on delete cascade,
  autor_id uuid references public.usuarios(id) on delete set null,
  tipo text not null default 'texto' check (tipo in ('texto','audio','arquivo','sistema')),
  corpo text,
  reply_to uuid references public.comunicacao_mensagens(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.comunicacao_anexos (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.comunicacao_mensagens(id) on delete cascade,
  conversa_id uuid not null references public.comunicacao_conversas(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  bucket text not null default 'communication-files',
  path text not null,
  nome_original text,
  mime_type text,
  tamanho bigint,
  tipo text not null default 'arquivo' check (tipo in ('imagem','video','audio','pdf','planilha','documento','arquivo')),
  created_at timestamptz not null default now()
);

create table if not exists public.comunicacao_leituras (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.comunicacao_mensagens(id) on delete cascade,
  conversa_id uuid not null references public.comunicacao_conversas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  lido_em timestamptz not null default now(),
  unique (mensagem_id, usuario_id)
);

create index if not exists idx_comunicacao_conversas_ativas on public.comunicacao_conversas(tipo, nome) where deleted_at is null and ativo = true;
create index if not exists idx_comunicacao_membros_usuario on public.comunicacao_membros(usuario_id) where saiu_em is null;
create index if not exists idx_comunicacao_mensagens_conversa on public.comunicacao_mensagens(conversa_id, created_at desc) where deleted_at is null;
create index if not exists idx_comunicacao_anexos_conversa on public.comunicacao_anexos(conversa_id, created_at desc);
create index if not exists idx_comunicacao_leituras_usuario on public.comunicacao_leituras(usuario_id, conversa_id);

do $$
begin
  begin
    alter table public.comunicacao_conversas add constraint comunicacao_conversas_nome_tipo_unique unique (tipo, nome);
  exception
    when duplicate_object then null;
  end;
end $$;

insert into storage.buckets (id, name, public)
values ('communication-files', 'communication-files', false)
on conflict (id) do nothing;

alter table public.comunicacao_perfis enable row level security;
alter table public.comunicacao_conversas enable row level security;
alter table public.comunicacao_membros enable row level security;
alter table public.comunicacao_mensagens enable row level security;
alter table public.comunicacao_anexos enable row level security;
alter table public.comunicacao_leituras enable row level security;

drop policy if exists "comunicacao_perfis_read" on public.comunicacao_perfis;
drop policy if exists "comunicacao_perfis_write" on public.comunicacao_perfis;
drop policy if exists "comunicacao_conversas_read" on public.comunicacao_conversas;
drop policy if exists "comunicacao_conversas_write" on public.comunicacao_conversas;
drop policy if exists "comunicacao_membros_read" on public.comunicacao_membros;
drop policy if exists "comunicacao_membros_write" on public.comunicacao_membros;
drop policy if exists "comunicacao_mensagens_read" on public.comunicacao_mensagens;
drop policy if exists "comunicacao_mensagens_write" on public.comunicacao_mensagens;
drop policy if exists "comunicacao_anexos_read" on public.comunicacao_anexos;
drop policy if exists "comunicacao_anexos_write" on public.comunicacao_anexos;
drop policy if exists "comunicacao_leituras_read" on public.comunicacao_leituras;
drop policy if exists "comunicacao_leituras_write" on public.comunicacao_leituras;

create policy "comunicacao_perfis_read" on public.comunicacao_perfis for select using (public.can_read_operational());
create policy "comunicacao_perfis_write" on public.comunicacao_perfis for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "comunicacao_conversas_read" on public.comunicacao_conversas for select using (deleted_at is null and public.can_read_operational());
create policy "comunicacao_conversas_write" on public.comunicacao_conversas for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "comunicacao_membros_read" on public.comunicacao_membros for select using (public.can_read_operational());
create policy "comunicacao_membros_write" on public.comunicacao_membros for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "comunicacao_mensagens_read" on public.comunicacao_mensagens for select using (deleted_at is null and public.can_read_operational());
create policy "comunicacao_mensagens_write" on public.comunicacao_mensagens for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "comunicacao_anexos_read" on public.comunicacao_anexos for select using (public.can_read_operational());
create policy "comunicacao_anexos_write" on public.comunicacao_anexos for all using (public.can_read_operational()) with check (public.can_read_operational());
create policy "comunicacao_leituras_read" on public.comunicacao_leituras for select using (public.can_read_operational());
create policy "comunicacao_leituras_write" on public.comunicacao_leituras for all using (public.can_read_operational()) with check (public.can_read_operational());

drop policy if exists "communication_files_read" on storage.objects;
drop policy if exists "communication_files_insert" on storage.objects;
drop policy if exists "communication_files_update" on storage.objects;
drop policy if exists "communication_files_delete" on storage.objects;

create policy "communication_files_read"
on storage.objects for select
using (bucket_id = 'communication-files' and public.can_read_operational());

create policy "communication_files_insert"
on storage.objects for insert
with check (bucket_id = 'communication-files' and public.can_read_operational());

create policy "communication_files_update"
on storage.objects for update
using (bucket_id = 'communication-files' and public.can_read_operational())
with check (bucket_id = 'communication-files' and public.can_read_operational());

create policy "communication_files_delete"
on storage.objects for delete
using (bucket_id = 'communication-files' and public.can_read_operational());

insert into public.comunicacao_conversas (tipo, nome, descricao, equipe, area, metadata)
values
  ('grupo','Mecânica C','Grupo operacional da equipe Mecânica C','mecanica_c','mecanica','{"seed":true}'::jsonb),
  ('grupo','Mecânica D','Grupo operacional da equipe Mecânica D','mecanica_d','mecanica','{"seed":true}'::jsonb),
  ('grupo','Mecânica H','Grupo operacional da equipe Mecânica H','mecanica_h','mecanica','{"seed":true}'::jsonb),
  ('grupo','Elétrica B','Grupo operacional da equipe Elétrica B','eletrica_b','eletrica','{"seed":true}'::jsonb),
  ('grupo','Elétrica F','Grupo operacional da equipe Elétrica F','eletrica_f','eletrica','{"seed":true}'::jsonb),
  ('grupo','Elétrica D','Grupo operacional da equipe Elétrica D','eletrica_d','eletrica','{"seed":true}'::jsonb),
  ('grupo','Elétrica H','Grupo operacional da equipe Elétrica H','eletrica_h','eletrica','{"seed":true}'::jsonb),
  ('grupo','Automação A','Grupo operacional da equipe Automação A','automacao_a','automacao','{"seed":true}'::jsonb),
  ('grupo','Automação E','Grupo operacional da equipe Automação E','automacao_e','automacao','{"seed":true}'::jsonb),
  ('grupo','CCO','Comunicação entre CCO e operação',null,'cco','{"seed":true}'::jsonb),
  ('grupo','Supervisão','Comunicação dos supervisores',null,'supervisao','{"seed":true}'::jsonb),
  ('grupo','Gerência','Comunicação gerencial',null,'gerencia','{"seed":true}'::jsonb),
  ('grupo','Diretoria','Comunicação da diretoria',null,'diretoria','{"seed":true}'::jsonb)
on conflict (tipo, nome) do nothing;

do $$
begin
  begin
    alter publication supabase_realtime add table public.comunicacao_mensagens;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.comunicacao_leituras;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
