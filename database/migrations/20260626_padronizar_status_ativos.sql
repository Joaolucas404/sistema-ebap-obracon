-- Padroniza os status operacionais dos ativos sem recriar tabelas.
-- Valores oficiais: operando, atencao, parado, em_manutencao.

update public.ativos
   set status_operacional = case status_operacional
     when 'operando_restricao' then 'atencao'
     when 'fora_operacao' then 'parado'
     when 'manutencao' then 'em_manutencao'
     else status_operacional
   end
 where status_operacional in ('operando_restricao','fora_operacao','manutencao');

update public.ativo_status_historico
   set status_anterior = case status_anterior
     when 'operando_restricao' then 'atencao'
     when 'fora_operacao' then 'parado'
     when 'manutencao' then 'em_manutencao'
     else status_anterior
   end,
       status_novo = case status_novo
     when 'operando_restricao' then 'atencao'
     when 'fora_operacao' then 'parado'
     when 'manutencao' then 'em_manutencao'
     else status_novo
   end
 where status_anterior in ('operando_restricao','fora_operacao','manutencao')
    or status_novo in ('operando_restricao','fora_operacao','manutencao');

alter table public.ativos
  drop constraint if exists ativos_status_operacional_check;

alter table public.ativos
  add constraint ativos_status_operacional_check
  check (status_operacional in ('operando','atencao','parado','em_manutencao'));

alter table public.ativo_status_historico
  drop constraint if exists ativo_status_historico_status_check;

alter table public.ativo_status_historico
  add constraint ativo_status_historico_status_check
  check (status_novo in ('operando','atencao','parado','em_manutencao'));
