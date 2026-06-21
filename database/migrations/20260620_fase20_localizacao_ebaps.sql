alter table public.ebaps
  add column if not exists link_maps text,
  add column if not exists status_operacional text not null default 'OPERANDO',
  add column if not exists ativo boolean not null default true;

update public.ebaps
   set ativo = coalesce(ativo, ativa, true),
       status_operacional = case
         when upper(coalesce(status_operacional, '')) in ('OPERANDO','ATENCAO','CRITICA') then upper(status_operacional)
         when status = 'critico' then 'CRITICA'
         when status = 'atencao' then 'ATENCAO'
         else 'OPERANDO'
       end;

alter table public.ebaps
  drop constraint if exists ebaps_status_operacional_check;

alter table public.ebaps
  add constraint ebaps_status_operacional_check
  check (status_operacional in ('OPERANDO','ATENCAO','CRITICA'));

create index if not exists idx_ebaps_status_operacional
  on public.ebaps(status_operacional)
  where deleted_at is null and ativo = true;

create index if not exists idx_ebaps_geo
  on public.ebaps(latitude, longitude)
  where deleted_at is null and ativo = true;

do $$
declare
  item record;
begin
  for item in
    select *
    from (values
      ('01', 'EBAP MARINHO', 'Marinho', -20.3294375::numeric, -40.3550625::numeric, 'https://www.google.com/maps/search/?api=1&query=MJCW%2B72%20Jardim%20Am%C3%A9rica%2C%20Cariacica%20-%20ES', 'normal', 'OPERANDO'),
      ('05', 'EBAP COMPORTAS', 'Comportas', -20.3658125::numeric, -40.3626875::numeric, 'https://google.com/maps/search/?api=1&query=JJMP%2BJV%20Nova%20Am%C3%A9rica%2C%20Vila%20Velha%20-%20ES', 'normal', 'OPERANDO'),
      ('03', 'EBAP COBILÂNDIA', 'Cobilandia', -20.3513125::numeric, -40.3570625::numeric, 'https://www.google.com/maps/search/?api=1&query=JJXV%2BC4%20Cobil%C3%A2ndia%2C%20Vila%20Velha%20-%20ES', 'normal', 'OPERANDO'),
      ('06', 'EBAP LARANJA', 'Laranja', -20.3970625::numeric, -40.3408125::numeric, 'https://www.google.com/maps/search/?api=1&query=JM35%2B4J%20Ibes%2C%20Vila%20Velha%20-%20ES', 'normal', 'OPERANDO'),
      ('08', 'EBAP BIGOSSI', 'Bigossi', -20.3425625::numeric, -40.2963125::numeric, 'https://www.google.com/maps/search/?api=1&query=MP43%2BWC%20Divino%20Esp%C3%ADrito%20Santo%2C%20Vila%20Velha%20-%20ES', 'atencao', 'ATENCAO'),
      ('10', 'EBAP CANAL DA COSTA', 'Canal da Costa', -20.3416875::numeric, -40.2896875::numeric, 'https://www.google.com/maps/search/?api=1&query=MP56%2B83%20Vila%20Velha%2C%20Esp%C3%ADrito%20Santo', 'atencao', 'ATENCAO'),
      ('11', 'EBAP FOZ DA COSTA', 'Foz da Costa', -20.3389000::numeric, -40.2839000::numeric, 'https://www.google.com/maps/place/Esta%C3%A7%C3%A3o+de+Bombeamento+de+%C3%81guas+Pluviais+(EBAP)+Foz+do+Costa/', 'critico', 'CRITICA'),
      ('07', 'EBAP GARANHUNS', 'Garanhuns', -20.3960625::numeric, -40.3205625::numeric, 'https://www.google.com/maps/search/?api=1&query=JM3H%2BGP%20Vila%20Velha%2C%20Esp%C3%ADrito%20Santo', 'normal', 'OPERANDO'),
      ('09', 'EBAP SÍTIO DE BATALHA', 'Sitio de Batalha', -20.3413125::numeric, -40.2900625::numeric, 'https://www.google.com/maps/search/?api=1&query=MP55%2BGW%20Vila%20Velha%20-%20ES', 'normal', 'OPERANDO'),
      ('02', 'EBAP ARIBIRI', 'Aribiri', -20.3349000::numeric, -40.3186000::numeric, 'https://www.google.com/maps/search/?api=1&query=Av.%20Jer%C3%B4nimo%20Monteiro%2C%204332%20-%20Centro%20de%20Vila%20Velha%20-%20ES', 'critico', 'CRITICA'),
      ('04', 'EBAP MARILÂNDIA', 'Marilandia', -20.3589375::numeric, -40.3610625::numeric, 'https://www.google.com/maps/search/?api=1&query=JJRQ%2B9G%20Cobil%C3%A2ndia%2C%20Vila%20Velha%20-%20ES', 'normal', 'OPERANDO')
    ) as seed(codigo, nome, nome_curto, latitude, longitude, link_maps, status, status_operacional)
  loop
    if exists (select 1 from public.ebaps where codigo = item.codigo) then
      update public.ebaps
         set nome = item.nome,
             nome_curto = item.nome_curto,
             latitude = item.latitude,
             longitude = item.longitude,
             link_maps = item.link_maps,
             status = item.status,
             status_operacional = item.status_operacional,
             ativa = true,
             ativo = true,
             updated_at = now()
       where codigo = item.codigo;
    elsif exists (select 1 from public.ebaps where upper(nome) = upper(item.nome)) then
      update public.ebaps
         set codigo = item.codigo,
             nome_curto = item.nome_curto,
             latitude = item.latitude,
             longitude = item.longitude,
             link_maps = item.link_maps,
             status = item.status,
             status_operacional = item.status_operacional,
             ativa = true,
             ativo = true,
             updated_at = now()
       where upper(nome) = upper(item.nome);
    else
      insert into public.ebaps (
        codigo, nome, nome_curto, latitude, longitude, link_maps, status, status_operacional, ativa, ativo
      )
      values (
        item.codigo, item.nome, item.nome_curto, item.latitude, item.longitude,
        item.link_maps, item.status, item.status_operacional, true, true
      );
    end if;
  end loop;
end $$;
