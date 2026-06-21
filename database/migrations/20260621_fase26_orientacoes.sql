create table if not exists public.orientacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null,
  descricao text,
  conteudo text,
  anexo_url text,
  versao integer not null default 1 check (versao > 0),
  status text not null default 'publicado',
  tipo text not null default 'orientacao',
  responsavel text,
  data_referencia date not null default current_date,
  created_by uuid references public.usuarios(id) on delete set null,
  updated_by uuid references public.usuarios(id) on delete set null,
  deleted_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint orientacoes_categoria_check check (categoria in (
    'operacao',
    'manutencao',
    'sst',
    'cco',
    'eletrica',
    'mecanica',
    'automacao',
    'emergencia'
  )),
  constraint orientacoes_status_check check (status in ('rascunho','publicado','arquivado')),
  constraint orientacoes_tipo_check check (tipo in ('orientacao','comunicado'))
);

create table if not exists public.orientacao_anexos (
  id uuid primary key default gen_random_uuid(),
  orientacao_id uuid not null references public.orientacoes(id) on delete cascade,
  nome text not null,
  bucket text not null default 'orientation-files',
  path text not null,
  mime_type text,
  tamanho bigint,
  uploaded_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket, path)
);

create table if not exists public.orientacao_versoes (
  id uuid primary key default gen_random_uuid(),
  orientacao_id uuid not null references public.orientacoes(id) on delete cascade,
  versao integer not null,
  titulo text not null,
  categoria text not null,
  descricao text,
  conteudo text,
  status text,
  usuario_id uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orientacoes_categoria on public.orientacoes(categoria) where deleted_at is null;
create index if not exists idx_orientacoes_status on public.orientacoes(status) where deleted_at is null;
create index if not exists idx_orientacoes_tipo on public.orientacoes(tipo) where deleted_at is null;
create index if not exists idx_orientacoes_created_at on public.orientacoes(created_at desc) where deleted_at is null;
create index if not exists idx_orientacoes_search on public.orientacoes using gin (
  to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(conteudo, '') || ' ' || coalesce(categoria, ''))
);
create index if not exists idx_orientacao_anexos_orientacao on public.orientacao_anexos(orientacao_id) where deleted_at is null;
create index if not exists idx_orientacao_versoes_orientacao on public.orientacao_versoes(orientacao_id, versao desc);

create or replace function public.is_orientacoes_creator(p_user_id uuid)
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
       and perfil in ('supervisor','gerencia','diretoria')
  );
$$;

create or replace function public.is_orientacoes_editor(p_user_id uuid)
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

create or replace function public.orientacoes_preparar_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.titulo is distinct from new.titulo
    or old.categoria is distinct from new.categoria
    or old.descricao is distinct from new.descricao
    or old.conteudo is distinct from new.conteudo
    or old.status is distinct from new.status
  ) then
    new.versao := coalesce(old.versao, 1) + 1;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.orientacoes_registrar_versao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or (
    old.titulo is distinct from new.titulo
    or old.categoria is distinct from new.categoria
    or old.descricao is distinct from new.descricao
    or old.conteudo is distinct from new.conteudo
    or old.status is distinct from new.status
  ) then
    insert into public.orientacao_versoes (
      orientacao_id, versao, titulo, categoria, descricao, conteudo, status, usuario_id
    )
    values (
      new.id,
      new.versao,
      new.titulo,
      new.categoria,
      new.descricao,
      new.conteudo,
      new.status,
      coalesce(new.updated_by, new.created_by)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orientacoes_preparar_update on public.orientacoes;
create trigger trg_orientacoes_preparar_update
before update on public.orientacoes
for each row execute function public.orientacoes_preparar_update();

drop trigger if exists trg_orientacoes_registrar_versao on public.orientacoes;
create trigger trg_orientacoes_registrar_versao
after insert or update on public.orientacoes
for each row execute function public.orientacoes_registrar_versao();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'orientation-files',
  'orientation-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
