-- Auto cadastro de tecnicos e hierarquia de supervisao por equipe.

alter table public.usuarios
  add column if not exists equipe text,
  add column if not exists status_aprovacao text not null default 'aprovado',
  add column if not exists aprovado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists aprovado_em timestamptz,
  add column if not exists rejeitado_por uuid references public.usuarios(id) on delete set null,
  add column if not exists rejeitado_em timestamptz,
  add column if not exists motivo_rejeicao text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'usuarios_equipe_check'
      and conrelid = 'public.usuarios'::regclass
  ) then
    alter table public.usuarios
      add constraint usuarios_equipe_check
      check (
        equipe is null or equipe in (
          'mecanica_c','mecanica_d','mecanica_h',
          'eletrica_b','eletrica_f','eletrica_d','eletrica_h',
          'automacao_a','automacao_e'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'usuarios_status_aprovacao_check'
      and conrelid = 'public.usuarios'::regclass
  ) then
    alter table public.usuarios
      add constraint usuarios_status_aprovacao_check
      check (status_aprovacao in ('pendente','aprovado','rejeitado'));
  end if;
end $$;

update public.usuarios
   set status_aprovacao = 'aprovado',
       aprovado_em = coalesce(aprovado_em, criado_em, now())
 where status_aprovacao is null
    or status_aprovacao = '';

create index if not exists idx_usuarios_status_aprovacao on public.usuarios(status_aprovacao) where deleted_at is null;
create index if not exists idx_usuarios_equipe on public.usuarios(equipe) where deleted_at is null;
create index if not exists idx_usuarios_area_status on public.usuarios(area_operacional, status_aprovacao) where deleted_at is null;
