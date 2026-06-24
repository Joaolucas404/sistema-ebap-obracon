alter table public.usuarios
  add column if not exists area_operacional text,
  add column if not exists area_supervisao text;

create table if not exists public.supervisor_areas (
  id uuid primary key default gen_random_uuid(),
  area text not null unique,
  nome text not null,
  supervisor_id uuid references public.usuarios(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.supervisor_areas enable row level security;

drop policy if exists "supervisor_areas_read_operational" on public.supervisor_areas;
create policy "supervisor_areas_read_operational"
  on public.supervisor_areas
  for select
  using (deleted_at is null and public.can_read_operational());

drop policy if exists "supervisor_areas_admin_write" on public.supervisor_areas;
create policy "supervisor_areas_admin_write"
  on public.supervisor_areas
  for all
  using (public.current_app_role() in ('anon','gerencia','diretoria','service_role'))
  with check (true);

do $$
begin
  alter table public.usuarios drop constraint if exists usuarios_area_operacional_check;
  alter table public.usuarios
    add constraint usuarios_area_operacional_check
    check (
      area_operacional is null
      or area_operacional in (
        'todas',
        'mecanica',
        'eletrica',
        'automacao',
        'operacional',
        'sst',
        'administrativo',
        'almoxarifado',
        'financeiro',
        'cco',
        'diretoria',
        'gerencia',
        'prefeitura'
      )
    );
exception
  when duplicate_object then null;
end $$;

update public.usuarios
   set area_operacional = case
     when perfil = 'diretoria' then coalesce(area_operacional, 'todas')
     when perfil = 'gerencia' then coalesce(area_operacional, 'todas')
     when perfil = 'cco' then coalesce(area_operacional, 'cco')
     when perfil = 'sst' then coalesce(area_operacional, 'sst')
     when perfil = 'administrativo' then coalesce(area_operacional, 'administrativo')
     when perfil = 'almoxarifado' then coalesce(area_operacional, 'almoxarifado')
     when perfil = 'financeiro' then coalesce(area_operacional, 'financeiro')
     when perfil = 'prefeitura' then coalesce(area_operacional, 'prefeitura')
     else area_operacional
   end,
       area_supervisao = case
         when perfil = 'supervisor' then coalesce(area_supervisao, area_operacional)
         else area_supervisao
       end,
       updated_at = now()
 where deleted_at is null;

create index if not exists idx_usuarios_area_operacional
  on public.usuarios(area_operacional) where deleted_at is null;

update public.supervisor_areas sa
   set supervisor_id = u.id,
       updated_at = now()
  from public.usuarios u
 where u.perfil = 'supervisor'
   and u.ativo = true
   and u.deleted_at is null
   and u.area_operacional = sa.area
   and (sa.supervisor_id is null or sa.supervisor_id = u.id);
