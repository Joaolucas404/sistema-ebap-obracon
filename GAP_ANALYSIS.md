# GAP ANALYSIS COMPLETA DO SIGEBAP

Data da analise: 20/06/2026  
Fonte de especificacao: `C:\Users\lucas\Downloads\SIGEBAP_Vila_Velha_APP_COMPLETO_TESTE.zip`  
Base comparada: React 18 + Vite + Supabase no workspace atual.

## Resumo Executivo

O ZIP especifica 21 modulos principais do SIGEBAP Vila Velha, alem de variantes por perfil e programas completos para SST e Almoxarifado. A implementacao atual ja possui uma base operacional real em React/Supabase para login, layout, dashboard, Relatorio Diario, validacao CCO de RO, Ordens de Servico, PDF, Almoxarifado, SST, usuarios e configuracoes.

Ainda ha uma diferenca relevante entre a plataforma atual e o APP completo do ZIP. Os maiores gaps estao em Administrativo/RH/DP/Frota, Contrato/Medicoes, Compras com aprovacao, Manutencao preventiva/preditiva/corretiva, Central de Alertas, CCO de OS, OS Diarias dedicadas, Localizacao EBAPs e relatorios consolidados.

## Percentual Geral

Modelo de calculo:

- IMPLEMENTADO = 100%
- PARCIALMENTE IMPLEMENTADO = 50%
- NAO IMPLEMENTADO = 0%

Resultado:

- Modulos avaliados: 21
- Implementados: 5
- Parcialmente implementados: 11
- Nao implementados: 5
- Percentual geral estimado: 50%

Este percentual mede cobertura funcional em relacao aos 21 modulos do ZIP, nao maturidade de producao. A auditoria anterior ainda mantem alerta critico sobre autenticacao/RLS antes de producao.

## Matriz Geral de Modulos

| # | Modulo ZIP | Status atual | Prioridade operacional |
|---|---|---|---|
| 1 | Login e Permissoes | PARCIALMENTE IMPLEMENTADO | CRITICA |
| 2 | Operador RDO/OS | PARCIALMENTE IMPLEMENTADO | CRITICA |
| 3 | CCO Validacao RDO/OS | PARCIALMENTE IMPLEMENTADO | CRITICA |
| 4 | Portal Supervisores/Gerencia/Diretoria | PARCIALMENTE IMPLEMENTADO | CRITICA |
| 5 | Tecnico OS Diarias | PARCIALMENTE IMPLEMENTADO | ALTA |
| 6 | Prefeitura Abertura OS | PARCIALMENTE IMPLEMENTADO | CRITICA |
| 7 | Arquivo PDF e Rastreabilidade | IMPLEMENTADO | ALTA |
| 8 | Dashboard Geral Integrado | IMPLEMENTADO | ALTA |
| 9 | Almoxarifado/Compras/Estoque | PARCIALMENTE IMPLEMENTADO | ALTA |
| 10 | SST Seguranca do Trabalho | IMPLEMENTADO | ALTA |
| 11 | Administrativo/RH/DP/Frota | NAO IMPLEMENTADO | MEDIA |
| 12 | Prefeitura Fiscalizacao/Contrato/Medicoes | NAO IMPLEMENTADO | ALTA |
| 13 | Painel Executivo Premium | PARCIALMENTE IMPLEMENTADO | ALTA |
| 14 | Manutencao Preventiva/Preditiva/Corretiva | NAO IMPLEMENTADO | ALTA |
| 15 | Central Alertas/Notificacoes | PARCIALMENTE IMPLEMENTADO | ALTA |
| 16 | Pedidos de Compra/Aprovacao Gerencia | NAO IMPLEMENTADO | ALTA |
| 17 | Central Cadastros/Configuracoes | PARCIALMENTE IMPLEMENTADO | MEDIA |
| 18 | Portal Unico SIGEBAP | PARCIALMENTE IMPLEMENTADO | ALTA |
| 19 | Consolidacao Final App Integrado | PARCIALMENTE IMPLEMENTADO | ALTA |
| 20 | Banco de Dados Supabase Estrutura | IMPLEMENTADO | CRITICA |
| 21 | Padrao Visual Responsivo/PDF | IMPLEMENTADO | ALTA |

## Analise por Modulo

### 1. Login e Permissoes

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/login`
- `/usuarios`
- `/config`
- `/unauthorized`

Tabelas utilizadas:

- `usuarios`
- `perfis`
- `permissoes`
- `perfil_permissoes`
- `auditoria`

Funcionalidades implementadas:

- Login por usuario/senha.
- Rotas protegidas.
- Controle de permissoes por perfil no frontend.
- Administracao de usuarios.
- Desativacao, reativacao e exclusao logica de usuario.

Funcionalidades faltantes:

- Autenticacao segura via Supabase Auth ou backend/RPC sem expor hash.
- Claims reais de perfil no JWT.
- Permissoes usando banco como fonte oficial.
- Politicas RLS alinhadas ao usuario autenticado real.
- Troca obrigatoria de senha, recuperacao de senha, rate limit e sessao segura.

Dependencias:

- Refatoracao de autenticacao.
- RLS de producao.

Prioridade operacional: CRITICA

### 2. Operador RDO/OS

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/relatorio`
- `/os`
- `/os/:id`
- `/acervo-operador` como placeholder

Tabelas utilizadas:

- `relatorios_diarios`
- `relatorio_diario_secoes`
- `relatorio_diario_itens`
- `ordens_servico`
- `comentarios`
- `anexos`

Funcionalidades implementadas:

- Relatorio Diario com etapas.
- Checklist de operacao, bombas, rastelos, comportas, eletrocentro, geradores, CCO, ocorrencias e fotos.
- Autosave e finalizacao para `pendente_validacao_cco`.
- Abertura e acompanhamento de OS por perfil permitido.

Funcionalidades faltantes:

- Acervo do operador real.
- Fluxo dedicado de OS criada pelo operador e validada pelo CCO antes da manutencao.
- Relatorios consolidados por operador.
- Notificacoes completas para devolucao/correcao do RO.

Dependencias:

- Central de notificacoes.
- CCO de OS.
- Arquivo/consulta historica por operador.

Prioridade operacional: CRITICA

### 3. CCO Validacao RDO/OS

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/cco-relatorios-diarios`
- `/cco-analise-os` como placeholder

Tabelas utilizadas:

- `daily_reports` equivalente: `relatorios_diarios`
- `cco_validations` equivalente: `validacoes_cco`
- `notifications` equivalente: `notificacoes`
- `audit_logs` equivalente: `auditoria`

Funcionalidades implementadas:

- Fila CCO de relatorios diarios.
- Aprovar, rejeitar e solicitar correcao.
- Historico CCO.
- Dashboard CCO basico.

Funcionalidades faltantes:

- CCO de OS da operacao.
- Analise e validacao de OS antes de manutencao.
- SLA, fila por prioridade e regras de devolucao por tipo.
- Central de notificacoes visual.

Dependencias:

- Modulo de notificacoes.
- Fluxo de OS da operacao.

Prioridade operacional: CRITICA

### 4. Portal Supervisores/Gerencia/Diretoria

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/dashboard`
- `/dashboard-os`
- `/os`
- `/os/:id`
- `/manutencao` placeholder
- `/sala-situacao-ebaps` placeholder

Tabelas utilizadas:

- `ordens_servico`
- `os_historico`
- `usuarios`
- `ebaps`
- `relatorios_diarios`

Funcionalidades implementadas:

- Supervisor atribui/programa/movimenta OS.
- Diretoria e gerencia visualizam dados amplos.
- Dashboard executivo e dashboard de OS.

Funcionalidades faltantes:

- Portais separados por area: automacao, eletrica, limpeza, mecanica, operacao.
- Visao dedicada gerencia operacional/manutencao/administrativa.
- Visao dedicada diretoria executiva/operacional/tecnica.
- Programacao de equipes completa.

Dependencias:

- Manutencao preventiva/preditiva/corretiva.
- Cadastros de equipes/turnos/areas.

Prioridade operacional: CRITICA

### 5. Tecnico OS Diarias

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/os`
- `/os/:id`
- `/os-diaria` placeholder

Tabelas utilizadas:

- `ordens_servico`
- `os_historico`
- `comentarios`
- `anexos`

Funcionalidades implementadas:

- Tecnico visualiza OS atribuidas ou encaminhadas.
- Registra execucao.
- Anexa fotos/arquivos.
- Conclui execucao para validacao.

Funcionalidades faltantes:

- Tela dedicada de OS diaria.
- Roteiro diario por tecnico.
- Checklist de execucao por area.
- Apontamento de horas/equipe/material integrado.

Dependencias:

- Manutencao.
- Almoxarifado integrado a OS.
- Programacao de equipes.

Prioridade operacional: ALTA

### 6. Prefeitura Abertura OS

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/os`
- `/os/:id`
- `/relatorios` placeholder

Tabelas utilizadas:

- `ordens_servico`
- `os_historico`
- `comentarios`
- `anexos`

Funcionalidades implementadas:

- Prefeitura pode abrir, acompanhar, aprovar e reprovar OS conforme fluxo.
- Workflow oficial da OS da Prefeitura implementado em status.
- Motivo obrigatorio para devolucao/reprovacao.

Funcionalidades faltantes:

- Portal dedicado da Prefeitura.
- Fiscalizacao contratual.
- Medicoes e aceite formal.
- Relatorios/filtros de fiscalizacao.

Dependencias:

- Modulo Contrato/Medicoes.
- Arquivo PDF final de aceite.

Prioridade operacional: CRITICA

### 7. Arquivo PDF e Rastreabilidade

Status atual: IMPLEMENTADO

Telas existentes:

- `/arquivo-relatorios`
- Geracao em RO e OS.

Tabelas utilizadas:

- `archive_documents`
- `arquivo_pdf`
- `anexos`

Buckets:

- `pdf-archive`
- `report-photos`
- `service-order-files`

Funcionalidades implementadas:

- Gera PDF profissional para RO e OS.
- Salva no bucket `pdf-archive`.
- Registra arquivo no banco.
- QR Code para consulta futura.
- Miniaturas de fotos no PDF.

Funcionalidades faltantes:

- Consulta publica/assinada pelo QR.
- Hash criptografico real do PDF.
- Versionamento/substituicao formal de documento.
- Assinaturas digitais.

Dependencias:

- Central de arquivo final.
- Politicas Storage definitivas.

Prioridade operacional: ALTA

### 8. Dashboard Geral Integrado

Status atual: IMPLEMENTADO

Telas existentes:

- `/dashboard`
- `/dashboard-os`

Tabelas utilizadas:

- `ordens_servico`
- `relatorios_diarios`
- `ebaps`
- dados locais de apoio em `relatorioGerencialEbaps.js`

Funcionalidades implementadas:

- KPIs reais de OS.
- Situacao das EBAPs.
- Graficos por status e area.
- Ultimas OS e ultimos ROs.
- Cards de criticidade.

Funcionalidades faltantes:

- Substituir dados estaticos do relatorio gerencial por origem Supabase.
- Views/RPCs agregadas para performance.
- Drilldown completo por indicador.

Dependencias:

- Views gerenciais.
- Cadastro operacional das EBAPs.

Prioridade operacional: ALTA

### 9. Almoxarifado/Compras/Estoque

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/almoxarifado`
- `/compras` placeholder

Tabelas utilizadas:

- `almoxarifado_itens`
- `almoxarifado_locais`
- `movimentacoes_estoque`
- `compras` modelada, sem pagina real.
- `compra_aprovacoes` modelada, sem pagina real.

Funcionalidades implementadas:

- Dashboard de estoque.
- Cadastro de itens.
- Entrada e saida.
- Estoque minimo.
- Historico de movimentacoes.
- RPC transacional de movimentacao.

Funcionalidades faltantes:

- Pedidos de compra.
- Aprovacao por gerencia.
- Emprestimo de ferramentas completo.
- Integracao operacional real de material com OS.
- Recebimento de compras alimentando estoque.

Dependencias:

- Modulo Compras.
- Fornecedores.
- Aprovacoes.
- Integracao OS/almoxarifado.

Prioridade operacional: ALTA

### 10. SST Seguranca do Trabalho

Status atual: IMPLEMENTADO

Telas existentes:

- `/sst`
- Vinculos SST em `/os/:id`

Tabelas utilizadas:

- `epi_itens`
- `epi_entregas`
- `treinamentos`
- `funcionario_treinamentos`
- `apr`
- `apt`
- `inspecoes`
- `ocorrencias`
- `planos_acao`

Funcionalidades implementadas:

- Dashboard SST.
- Cadastro de EPIs.
- Entrega de EPIs.
- Cadastro e vencimento de treinamentos.
- APR.
- APT.
- Inspecoes.
- Ocorrencias.
- Planos de acao.
- Vinculo com OS.

Funcionalidades faltantes:

- Upload de certificados/assinaturas.
- PDF de APR/APT/entrega de EPI.
- Assinatura digital de trabalhador/responsavel.
- Inventario completo por funcionario.

Dependencias:

- Storage SST.
- Arquivo PDF.
- Usuarios/funcionarios melhor estruturados.

Prioridade operacional: ALTA

### 11. Administrativo/RH/DP/Frota

Status atual: NAO IMPLEMENTADO

Telas existentes:

- `/administrativo` placeholder

Tabelas utilizadas:

- Sem tabelas especificas completas no frontend.

Funcionalidades implementadas:

- Apenas rota/menu placeholder.

Funcionalidades faltantes:

- Administrativo completo.
- RH/DP.
- Frota.
- Atestados.
- Documentos administrativos.
- Compras administrativas.

Dependencias:

- Cadastros de colaboradores.
- Arquivo digital.
- Compras/fornecedores.

Prioridade operacional: MEDIA

### 12. Prefeitura Fiscalizacao/Contrato/Medicoes

Status atual: NAO IMPLEMENTADO

Telas existentes:

- `/financeiro-contrato` placeholder
- `/relatorios` placeholder

Tabelas utilizadas:

- `contratos`
- `medicoes`
- `financeiro_lancamentos`
- `fornecedores`

Funcionalidades implementadas:

- Modelagem inicial no banco.

Funcionalidades faltantes:

- Fiscalizacao contratual.
- Medicoes.
- Aceite da prefeitura.
- Relatorios financeiros/contratuais.
- Anexos de contrato e medicao.

Dependencias:

- Contratos.
- Medicoes.
- PDF/arquivo.
- Prefeitura.

Prioridade operacional: ALTA

### 13. Painel Executivo Premium

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/dashboard`

Tabelas utilizadas:

- `ordens_servico`
- `relatorios_diarios`
- `ebaps`

Funcionalidades implementadas:

- Dashboard executivo operacional.
- KPIs, graficos e cards de EBAP.

Funcionalidades faltantes:

- Painel premium especifico para diretoria/gerencia.
- Indicadores financeiros, contratuais, compras, SST e manutencao consolidada.
- Exportacao gerencial.

Dependencias:

- Modulos compras, contratos, manutencao, administrativo.
- Agregacoes Supabase.

Prioridade operacional: ALTA

### 14. Manutencao Preventiva/Preditiva/Corretiva

Status atual: NAO IMPLEMENTADO

Telas existentes:

- `/manutencao` placeholder
- `/sala-situacao-ebaps` placeholder

Tabelas utilizadas:

- `ordens_servico` cobre manutencao corretiva por OS, mas nao o modulo especifico.

Funcionalidades implementadas:

- Fluxo corretivo via OS.

Funcionalidades faltantes:

- Planos preventivos.
- Preditiva.
- Calendario de manutencao.
- Ordens recorrentes.
- Checklists tecnicos por equipamento.
- Programacao de equipes.

Dependencias:

- Equipamentos.
- Equipes.
- OS.
- Almoxarifado.

Prioridade operacional: ALTA

### 15. Central Alertas/Notificacoes

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- Sem tela dedicada.

Tabelas utilizadas:

- `notificacoes`

Funcionalidades implementadas:

- Algumas notificacoes sao geradas por OS e CCO.
- Modelagem da tabela existe.

Funcionalidades faltantes:

- Central visual de alertas.
- Badge de notificacoes.
- Leitura/arquivamento.
- Preferencias de notificacao.
- Alertas por vencimento, OS, SST, estoque, compras.

Dependencias:

- Topbar/sidebar.
- Regras de alerta por modulo.

Prioridade operacional: ALTA

### 16. Pedidos de Compra/Aprovacao Gerencia

Status atual: NAO IMPLEMENTADO

Telas existentes:

- `/compras` placeholder

Tabelas utilizadas:

- `compras`
- `compra_aprovacoes`
- `fornecedores`

Funcionalidades implementadas:

- Modelagem inicial no banco.

Funcionalidades faltantes:

- Criacao de pedido.
- Fluxo de aprovacao gerencial.
- Cotacao/fornecedor.
- Recebimento.
- Integracao com almoxarifado.
- Dashboard de compras.

Dependencias:

- Almoxarifado.
- Financeiro.
- Fornecedores.

Prioridade operacional: ALTA

### 17. Central Cadastros/Configuracoes

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- `/config`
- `/usuarios`

Tabelas utilizadas:

- `usuarios`
- `perfis`
- `permissoes`
- `ebaps`
- `equipamentos`

Funcionalidades implementadas:

- Usuarios.
- Preferencias/configuracoes basicas.

Funcionalidades faltantes:

- Central completa de cadastros.
- EBAPs editaveis.
- Equipamentos editaveis.
- Areas, equipes, turnos, fornecedores, contratos, centros de custo.

Dependencias:

- Permissoes por perfil.
- Cadastros mestres.

Prioridade operacional: MEDIA

### 18. Portal Unico SIGEBAP

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- Layout unico com sidebar/topbar.
- Menu por perfil.
- Rotas protegidas.

Tabelas utilizadas:

- Varias, conforme modulo.

Funcionalidades implementadas:

- Shell principal da aplicacao.
- Identidade visual.
- Navegacao por perfil.

Funcionalidades faltantes:

- Home/portal unico com todos os modulos em estado real.
- Busca global.
- Central de tarefas.
- Alertas globais.

Dependencias:

- Central de notificacoes.
- Modulos pendentes.

Prioridade operacional: ALTA

### 19. Consolidacao Final App Integrado

Status atual: PARCIALMENTE IMPLEMENTADO

Telas existentes:

- Integracao parcial entre dashboard, OS, RO, CCO, PDF, Almoxarifado e SST.

Tabelas utilizadas:

- Multiplas tabelas operacionais.

Funcionalidades implementadas:

- Nucleo operacional integrado.
- OS ligada a PDF, comentarios, anexos, SST.
- RO ligado a CCO e PDF.

Funcionalidades faltantes:

- Integracao compras/almoxarifado/financeiro/contrato/manutencao.
- Notificacoes globais.
- RLS/producao.
- Testes end-to-end.

Dependencias:

- Conclusao dos modulos pendentes.
- Hardening de seguranca.

Prioridade operacional: ALTA

### 20. Banco de Dados Supabase Estrutura

Status atual: IMPLEMENTADO

Telas existentes:

- Nao aplicavel diretamente.

Tabelas utilizadas:

- Schema amplo em `database/schema.sql`.
- Migrations adicionais para Almoxarifado e SST.

Funcionalidades implementadas:

- Schema principal.
- Seeds.
- Indexes.
- Storage.
- RLS preparada.
- RPCs para alguns fluxos.

Funcionalidades faltantes:

- Ajuste definitivo de RLS para Supabase Auth/claims reais.
- Views/RPCs agregadas.
- Triggers de auditoria mais completas.
- Politicas Storage de producao.

Dependencias:

- Refatoracao de autenticacao.
- Segurança de producao.

Prioridade operacional: CRITICA

### 21. Padrao Visual Responsivo/PDF

Status atual: IMPLEMENTADO

Telas existentes:

- Login.
- Layout principal.
- Dashboard.
- PDF RO/OS.
- PWA/favicons.

Funcionalidades implementadas:

- Identidade visual Uniao Obracon.
- Logo institucional e logo iOS.
- Tema azul/verde.
- Responsividade principal.
- PDF com cabecalho, rodape, QR e imagens.

Funcionalidades faltantes:

- QA visual completo de todos os placeholders quando virarem modulos reais.
- Design system documentado.
- PDF para modulos futuros.

Dependencias:

- Finalizacao dos modulos pendentes.

Prioridade operacional: ALTA

## Conclusao

A plataforma possui aproximadamente metade da cobertura funcional prevista no pacote SIGEBAP completo. O nucleo operacional mais importante ja existe: Login, Dashboard, OS, RO, CCO-RO, PDF, Almoxarifado e SST. Para chegar a producao completa, as proximas fases devem priorizar seguranca/autenticacao, Compras, Manutencao, Contrato/Medicoes, Central de Alertas e Cadastros mestres.
