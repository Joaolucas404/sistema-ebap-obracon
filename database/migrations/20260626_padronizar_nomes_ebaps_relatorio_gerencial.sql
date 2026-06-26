-- Padroniza nomenclaturas das EBAPs conforme Relatório Gerencial de Disponibilidade.
-- Esta migração deve ser executada com permissão administrativa no Supabase.

update public.ebaps
set nome = 'EBAP Canal da Costa', nome_curto = 'Canal da Costa'
where nome = 'EBAP Canal do Costa';

update public.ebaps
set nome = 'EBAP Foz da Costa', nome_curto = 'Foz da Costa'
where nome = 'EBAP Foz do Costa';

update public.ebaps
set nome = 'EBAP Guaranhuns', nome_curto = 'Guaranhuns'
where nome = 'EBAP Garanhuns';

update public.ebaps
set nome = 'EBAP Laranja', nome_curto = 'Laranja'
where nome = 'EBAP Laranjas';

update public.ebaps
set nome = 'EBAP Marilândia', nome_curto = 'Marilândia'
where nome = 'EBAP Marilandia';

update public.ebaps
set nome = 'EBAP Sítio Batalha', nome_curto = 'Sítio Batalha'
where nome = 'EBAP Sitio Batalha';

update public.ebaps
set nome = 'EBAP Cobilândia', nome_curto = 'Cobilândia'
where nome = 'EBAP Cobilandia';

update public.ebaps
set nome = 'Estação de Comportas', nome_curto = 'Estação de Comportas'
where nome = 'EBAP Comportas';
