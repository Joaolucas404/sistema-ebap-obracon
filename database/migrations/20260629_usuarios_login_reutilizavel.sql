-- Libera reutilizacao de login para usuarios excluidos logicamente.
-- Usuarios ativos/pendentes continuam com login unico.

alter table public.usuarios
  drop constraint if exists usuarios_usuario_key;

create unique index if not exists usuarios_usuario_ativo_unique
  on public.usuarios(usuario)
  where deleted_at is null;
