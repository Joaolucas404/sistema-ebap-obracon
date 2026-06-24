insert into public.perfis (codigo, nome, descricao, nivel_acesso)
values
  ('operador','Operador','Preenche relatório diário e solicita OS.',10),
  ('tecnico','Técnico','Executa OS diárias e registra execução.',20),
  ('cco','CCO','Valida RO e OS geradas pela operação.',30),
  ('supervisor','Supervisor','Programa, acompanha e valida OS.',50),
  ('gerencia','Gerência','Acesso operacional amplo, sem administração de usuários.',80),
  ('diretoria','Diretoria','Acesso total e gestão de usuários.',100),
  ('prefeitura','Prefeitura','Abre OS, acompanha dashboards e valida entregas.',40),
  ('sst','SST','Segurança do trabalho, APR/APT, EPI e inspeções.',45),
  ('administrativo','Administrativo','Rotinas administrativas, documentos e compras.',35),
  ('almoxarifado','Almoxarifado','Estoque, ferramentas, EPI/EPC e movimentações.',35),
  ('financeiro','Financeiro','Financeiro, contratos, medições e compras.',45)
on conflict (codigo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  nivel_acesso = excluded.nivel_acesso,
  updated_at = now();

insert into public.permissoes (codigo, nome, modulo, rota, acao)
values
  ('dashboard.read','Dashboard','dashboard','/dashboard','read'),
  ('dashboard_os.read','Dashboard de OS','dashboard','/dashboard-os','read'),
  ('localizacao_ebaps.read','Localização EBAPs','ebaps','/localizacao-ebaps','read'),
  ('relatorio.read','Relatório Diário','relatorios','/relatorio','read'),
  ('relatorio.write','Criar Relatório Diário','relatorios','/relatorio','write'),
  ('cco_ro.read','Visualizar RO no CCO','cco','/cco-relatorios-diarios','read'),
  ('cco_ro.validate','Validar RO no CCO','cco','/cco-relatorios-diarios','approve'),
  ('cco_os.validate','Validar OS no CCO','cco','/cco-analise-os','approve'),
  ('os.read','Ler OS','os','/os','read'),
  ('os.write','Criar/Editar OS','os','/os','write'),
  ('supervisao.read','Supervisão por Área','os','/supervisao','read'),
  ('supervisao.manage','Gerenciar Supervisão por Área','os','/supervisao','write'),
  ('manutencao.manage','Gerenciar Manutenção','manutencao','/manutencao','write'),
  ('sala_situacao.manage','Sala de Situação','manutencao','/sala-situacao-ebaps','write'),
  ('os_diaria.execute','Executar OS Diária','os','/os-diaria','write'),
  ('arquivo.read','Arquivo PDF','arquivo','/arquivo-relatorios','read'),
  ('acervo.read','Acervo Operador','arquivo','/acervo-operador','read'),
  ('relatorios.read','Relatórios Consolidados','relatorios','/relatorios','read'),
  ('almoxarifado.manage','Almoxarifado','almoxarifado','/almoxarifado','write'),
  ('compras.manage','Compras','compras','/compras','write'),
  ('financeiro.manage','Financeiro/Contrato','financeiro','/financeiro-contrato','write'),
  ('sst.manage','SST','sst','/sst','write'),
  ('administrativo.manage','Administrativo','administrativo','/administrativo','write'),
  ('orientacoes.read','Orientações','orientacoes','/orientacoes','read'),
  ('orientacoes.create','Criar Orientações','orientacoes','/orientacoes','create'),
  ('orientacoes.edit','Editar Orientações','orientacoes','/orientacoes','write'),
  ('orientacoes.delete','Excluir Orientações','orientacoes','/orientacoes','delete'),
  ('config.manage','Configurações','config','/config','write'),
  ('usuarios.manage','Usuários','usuarios','/usuarios','write')
on conflict (codigo) do update set
  nome = excluded.nome,
  modulo = excluded.modulo,
  rota = excluded.rota,
  acao = excluded.acao,
  updated_at = now();

insert into public.perfil_permissoes (perfil_id, permissao_id)
select p.id, pe.id
from public.perfis p
join public.permissoes pe on (
  p.codigo = 'diretoria'
  or (p.codigo = 'gerencia' and pe.codigo <> 'orientacoes.delete')
  or (p.codigo = 'operador' and pe.codigo in ('dashboard.read','relatorio.read','relatorio.write','cco_ro.read','acervo.read','orientacoes.read'))
  or (p.codigo = 'tecnico' and pe.codigo in ('dashboard.read','os.read','os.write','os_diaria.execute','arquivo.read','orientacoes.read'))
  or (p.codigo = 'cco' and pe.codigo in ('dashboard.read','cco_ro.read','cco_ro.validate','cco_os.validate','supervisao.read','orientacoes.read'))
  or (p.codigo = 'supervisor' and pe.codigo in ('dashboard.read','dashboard_os.read','os.read','os.write','supervisao.read','supervisao.manage','relatorio.read','cco_ro.read','manutencao.manage','sala_situacao.manage','os_diaria.execute','arquivo.read','orientacoes.read','orientacoes.create'))
  or (p.codigo = 'prefeitura' and pe.codigo in ('dashboard.read','dashboard_os.read','os.read','os.write','localizacao_ebaps.read','relatorios.read','financeiro.manage','orientacoes.read'))
  or (p.codigo = 'sst' and pe.codigo in ('dashboard.read','sst.manage','orientacoes.read'))
  or (p.codigo = 'administrativo' and pe.codigo in ('dashboard.read','administrativo.manage','orientacoes.read'))
  or (p.codigo = 'almoxarifado' and pe.codigo in ('dashboard.read','almoxarifado.manage','compras.manage','orientacoes.read'))
  or (p.codigo = 'financeiro' and pe.codigo in ('dashboard.read','financeiro.manage','compras.manage','orientacoes.read'))
)
on conflict do nothing;

insert into public.usuarios (usuario, senha_hash, nome, perfil, perfil_id, setor, ativo, atualizado_em)
select
  'admin',
  crypt('admin123', gen_salt('bf', 10)),
  'Administrador',
  'diretoria',
  p.id,
  'Diretoria',
  true,
  now()
from public.perfis p
where p.codigo = 'diretoria'
on conflict (usuario) do update set
  senha_hash = excluded.senha_hash,
  nome = excluded.nome,
  perfil = excluded.perfil,
  perfil_id = excluded.perfil_id,
  setor = excluded.setor,
  ativo = excluded.ativo,
  atualizado_em = now(),
  updated_at = now();

insert into public.ebaps (codigo, nome, nome_curto, status)
values
  ('01','EBAP Marinho','Marinho','atencao'),
  ('02','EBAP Aribiri','Aribiri','critico'),
  ('03','EBAP Cobilandia','Cobilandia','normal'),
  ('04','EBAP Marilandia','Marilandia','normal'),
  ('05','EBAP Comportas','Comportas','atencao'),
  ('06','EBAP Laranjas','Laranjas','atencao'),
  ('07','EBAP Garanhuns','Garanhuns','normal'),
  ('08','EBAP Bigossi','Bigossi','atencao'),
  ('09','EBAP Sitio Batalha','Sitio Batalha','normal'),
  ('10','EBAP Canal do Costa','Canal do Costa','atencao'),
  ('11','EBAP Foz do Costa','Foz do Costa','critico')
on conflict (codigo) do update set
  nome = excluded.nome,
  nome_curto = excluded.nome_curto,
  status = excluded.status,
  updated_at = now();

insert into public.equipamento_tipos (codigo, nome, area, descricao)
values
  ('bomba','Bomba','Mecânica/Elétrica','Bombas P7105 e conjuntos de recalque.'),
  ('rastelo','Rastelo','Mecânica','Grades mecanizadas e rastelos.'),
  ('comporta','Comporta','Mecânica','Comportas, atuadores e vedações.'),
  ('eletrocentro','Eletrocentro','Elétrica','Painéis, QGBT, CLP, climatização e supervisório.'),
  ('gerador','Gerador/Diesel','Elétrica','Geradores, tanque e linha de combustível.'),
  ('cco','CCO/Supervisório','Automação','Comunicação, alarmes, supervisório e registro operacional.'),
  ('sensor','Sensor/Instrumentação','Automação','Sensores de nível, vazão, temperatura e comunicação.')
on conflict (codigo) do update set
  nome = excluded.nome,
  area = excluded.area,
  descricao = excluded.descricao,
  updated_at = now();

insert into public.almoxarifado_locais (codigo, nome, descricao)
values
  ('A2','Prateleira A2','Materiais elétricos de uso recorrente.'),
  ('B1','Prateleira B1','Disjuntores e componentes de proteção.'),
  ('ARM-TEC','Armário técnico','Ferramentas e instrumentos controlados.'),
  ('EPI','Área EPI/EPC','Equipamentos de proteção individual e coletiva.')
on conflict (codigo) do update set nome = excluded.nome, descricao = excluded.descricao, updated_at = now();

insert into public.almoxarifado_itens (codigo, nome, categoria, unidade, estoque_atual, estoque_minimo, controlado)
values
  ('ALM-0001','Cabo PP 4x10mm2','Material elétrico','m',38,20,false),
  ('ALM-0002','Disjuntor Tripolar 80 A','Material elétrico','un',4,2,false),
  ('ALM-0003','Multímetro True RMS','Ferramenta','un',2,1,true),
  ('ALM-0004','Martelete rompedor','Ferramenta','un',1,1,true),
  ('ALM-0005','Óculos de segurança','EPI','un',40,20,false)
on conflict (codigo) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  unidade = excluded.unidade,
  estoque_atual = excluded.estoque_atual,
  estoque_minimo = excluded.estoque_minimo,
  controlado = excluded.controlado,
  updated_at = now();

insert into public.sst_epi (codigo, nome, ca, categoria)
values
  ('EPI-OCULOS','Óculos de segurança',null,'Proteção ocular'),
  ('EPI-LUVA-BT','Luva isolante baixa tensão',null,'Proteção elétrica'),
  ('EPI-CAPACETE','Capacete com jugular',null,'Proteção cabeça'),
  ('EPI-CINTO','Cinto paraquedista',null,'Trabalho em altura')
on conflict (codigo) do update set
  nome = excluded.nome,
  ca = excluded.ca,
  categoria = excluded.categoria,
  updated_at = now();

insert into public.sst_treinamentos (codigo, nome, norma, carga_horaria, validade_meses)
values
  ('NR10','NR-10 Básico','NR-10',40,24),
  ('NR10-SEP','NR-10 SEP','NR-10',40,24),
  ('NR35','Trabalho em Altura','NR-35',8,24),
  ('APR-APT','APR/APT Operacional','Procedimento interno',4,12)
on conflict (codigo) do update set
  nome = excluded.nome,
  norma = excluded.norma,
  carga_horaria = excluded.carga_horaria,
  validade_meses = excluded.validade_meses,
  updated_at = now();
