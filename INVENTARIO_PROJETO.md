# INVENTARIO DO PROJETO SIGEBAP

Data: 20/06/2026  
Base: workspace React + Supabase atual.

## Rotas React

| Rota | Pagina/Componente | Status |
|---|---|---|
| `/` | `RootRedirect` | Implementado |
| `/login` | `Login.jsx` | Implementado |
| `/unauthorized` | `Unauthorized.jsx` | Implementado |
| `/dashboard` | `Dashboard.jsx` | Implementado |
| `/dashboard-os` | `OrdensServico.jsx` | Implementado como listagem/dashboard de OS |
| `/os` | `OrdensServico.jsx` | Implementado |
| `/os/:id` | `DetalheOS.jsx` | Implementado |
| `/relatorio` | `RelatorioDiario.jsx` | Implementado |
| `/cco-relatorios-diarios` | `CcoRelatoriosDiarios.jsx` | Implementado |
| `/arquivo-relatorios` | `ArquivoRelatorios.jsx` | Implementado |
| `/almoxarifado` | `Almoxarifado.jsx` | Implementado |
| `/sst` | `SST.jsx` | Implementado |
| `/localizacao-ebaps` | `PlaceholderPage.jsx` | Placeholder |
| `/cco-analise-os` | `PlaceholderPage.jsx` | Placeholder |
| `/manutencao` | `PlaceholderPage.jsx` | Placeholder |
| `/sala-situacao-ebaps` | `PlaceholderPage.jsx` | Placeholder |
| `/os-diaria` | `PlaceholderPage.jsx` | Placeholder |
| `/acervo-operador` | `PlaceholderPage.jsx` | Placeholder |
| `/relatorios` | `PlaceholderPage.jsx` | Placeholder |
| `/compras` | `PlaceholderPage.jsx` | Placeholder |
| `/financeiro-contrato` | `PlaceholderPage.jsx` | Placeholder |
| `/administrativo` | `PlaceholderPage.jsx` | Placeholder |
| `/orientacoes` | `PlaceholderPage.jsx` | Placeholder |
| `/config` | `Config.jsx` | Parcial |
| `/usuarios` | `Usuarios.jsx` | Implementado |

## Paginas

- `src/pages/Almoxarifado.jsx`
- `src/pages/ArquivoRelatorios.jsx`
- `src/pages/CcoRelatoriosDiarios.jsx`
- `src/pages/Config.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/DetalheOS.jsx`
- `src/pages/Login.jsx`
- `src/pages/OrdensServico.jsx`
- `src/pages/PlaceholderPage.jsx`
- `src/pages/RelatorioDiario.jsx`
- `src/pages/SST.jsx`
- `src/pages/Unauthorized.jsx`
- `src/pages/Usuarios.jsx`

## Components

### Layout/Auth/UI

- `src/components/auth/ProtectedRoute.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Topbar.jsx`
- `src/components/ui/EmptyState.jsx`
- `src/components/ui/KpiCard.jsx`
- `src/components/ui/Modal.jsx`
- `src/components/ui/PageHeader.jsx`
- `src/components/ui/StatusBadge.jsx`
- `src/components/ui/Toast.jsx`

### OS

- `src/components/os/OSCard.jsx`
- `src/components/os/OSComments.jsx`
- `src/components/os/OSEquipmentSelector.jsx`
- `src/components/os/OSFilters.jsx`
- `src/components/os/OSTimeline.jsx`

### Relatorio Diario

- `src/components/relatorio/RelatorioBombas.jsx`
- `src/components/relatorio/RelatorioCCO.jsx`
- `src/components/relatorio/RelatorioChecklistSection.jsx`
- `src/components/relatorio/RelatorioComportas.jsx`
- `src/components/relatorio/RelatorioEletrocentro.jsx`
- `src/components/relatorio/RelatorioFotos.jsx`
- `src/components/relatorio/RelatorioGeradores.jsx`
- `src/components/relatorio/RelatorioOcorrencias.jsx`
- `src/components/relatorio/RelatorioOperacao.jsx`
- `src/components/relatorio/RelatorioRastelos.jsx`
- `src/components/relatorio/RelatorioResumo.jsx`
- `src/components/relatorio/RelatorioStepper.jsx`

### CCO

- `src/components/cco/CcoFilters.jsx`
- `src/components/cco/CcoHistoryTimeline.jsx`
- `src/components/cco/CcoReportCard.jsx`
- `src/components/cco/CcoStatusBadge.jsx`
- `src/components/cco/CcoValidationModal.jsx`

### PDF

- `src/components/pdf/PdfTemplate.jsx`

### Almoxarifado

- `src/components/almoxarifado/AlmoxDashboard.jsx`
- `src/components/almoxarifado/AlmoxFilters.jsx`
- `src/components/almoxarifado/AlmoxItemForm.jsx`
- `src/components/almoxarifado/AlmoxItemsTable.jsx`
- `src/components/almoxarifado/AlmoxMovementForm.jsx`
- `src/components/almoxarifado/AlmoxMovementHistory.jsx`
- `src/components/almoxarifado/StockStatusBadge.jsx`

### SST

- `src/components/sst/SstDashboard.jsx`
- `src/components/sst/SstForms.jsx`
- `src/components/sst/SstStatusBadge.jsx`
- `src/components/sst/SstTables.jsx`

## Services

- `src/services/almoxarifadoService.js`
- `src/services/authService.js`
- `src/services/ccoService.js`
- `src/services/dashboardService.js`
- `src/services/osService.js`
- `src/services/pdfService.js`
- `src/services/relatorioService.js`
- `src/services/sstService.js`
- `src/services/usuariosService.js`

## Stores

- `src/store/almoxarifadoStore.js`
- `src/store/authStore.js`
- `src/store/sstStore.js`

## Configuracoes

- `src/config/brand.js`
- `src/config/menu.js`
- `src/config/permissions.js`

## Tabelas Supabase

### Schema principal

- `perfis`
- `permissoes`
- `perfil_permissoes`
- `usuarios`
- `ebaps`
- `equipamento_tipos`
- `equipamentos`
- `relatorios_diarios`
- `relatorio_diario_secoes`
- `relatorio_diario_itens`
- `validacoes_cco`
- `ordens_servico`
- `os_historico`
- `comentarios`
- `anexos`
- `arquivo_pdf`
- `archive_documents`
- `almoxarifado_locais`
- `almoxarifado_itens`
- `movimentacoes_estoque`
- `compras`
- `compra_aprovacoes`
- `fornecedores`
- `contratos`
- `financeiro_lancamentos`
- `medições`
- `sst_colaboradores`
- `sst_apr`
- `sst_epi`
- `sst_epi_entregas`
- `sst_treinamentos`
- `sst_treinamento_colaboradores`
- `sst_inspecoes`
- `sst_ocorrencias`
- `sst_planos_acao`
- `notificacoes`
- `auditoria`

### Migrations Fase 9

- Reforco de `almoxarifado_locais`
- Reforco de `almoxarifado_itens`
- Reforco de `movimentacoes_estoque`

### Migrations Fase 10.1

- `epi_itens`
- `epi_entregas`
- `treinamentos`
- `funcionario_treinamentos`
- `apr`

### Migrations Fase 10.2

- `apt`
- `inspecoes`
- `ocorrencias`
- `planos_acao`

## Buckets Storage

Definidos em `database/storage.sql`:

- `report-photos`
- `service-order-files`
- `pdf-archive`
- `sst-documents`
- `inventory-files`
- `contract-files`
- `purchase-files`

Uso atual:

- `report-photos`: usado no RO.
- `service-order-files`: usado em OS.
- `pdf-archive`: usado em PDFs.
- `sst-documents`: preparado, uso avancado ainda pendente para certificados/assinaturas.
- `inventory-files`: preparado, sem uso real.
- `contract-files`: preparado, sem uso real.
- `purchase-files`: preparado, sem uso real.

## RPCs/Funcoes

### Base

- `set_updated_at()`

### Almoxarifado

- `is_almox_manager(uuid)`
- `almox_salvar_item(...)`
- `almox_desativar_item(...)`
- `registrar_movimentacao_estoque(...)`

### SST Base

- `is_sst_manager(uuid)`
- `sst_status_treinamento(date)`
- `sst_salvar_epi(...)`
- `sst_registrar_entrega_epi(...)`
- `sst_salvar_treinamento(...)`
- `sst_registrar_funcionario_treinamento(...)`
- `sst_salvar_apr(...)`

### SST Avancado

- `sst_salvar_apt(...)`
- `sst_salvar_inspecao(...)`
- `sst_salvar_ocorrencia(...)`
- `sst_salvar_plano_acao(...)`

### RPCs esperadas pelo frontend

- `soft_delete_os_diretoria(...)`
- `soft_delete_usuario_diretoria(...)`

Observacao: estas RPCs sao chamadas pelos services, mas devem ser conferidas diretamente no Supabase se ja foram criadas no ambiente.

## Policies RLS

### Arquivo base `database/rls.sql`

Contem policies para:

- `perfis`
- `permissoes`
- `perfil_permissoes`
- `usuarios`
- `ebaps`
- `equipamento_tipos`
- `equipamentos`
- `relatorios_diarios`
- `relatorio_diario_secoes`
- `relatorio_diario_itens`
- `validacoes_cco`
- `ordens_servico`
- `os_historico`
- `comentarios`
- `anexos`
- `arquivo_pdf`
- `archive_documents`
- `almoxarifado_itens`
- `almoxarifado_locais`
- `movimentacoes_estoque`
- `compras`
- `compra_aprovacoes`
- `financeiro_lancamentos`
- `contratos`
- `fornecedores`
- `medições`
- `sst_*`
- `notificacoes`
- `auditoria`

### Migrations RLS adicionais

Almoxarifado:

- `almox_locais_read_profiles`
- `almox_locais_write_profiles`
- `almox_itens_read_profiles`
- `almox_itens_write_profiles`
- `movimentacoes_estoque_read_profiles`
- `movimentacoes_estoque_insert_profiles`

SST 10.1:

- `epi_itens_read_profiles`
- `epi_itens_write_profiles`
- `epi_entregas_read_profiles`
- `epi_entregas_write_profiles`
- `treinamentos_read_profiles`
- `treinamentos_write_profiles`
- `funcionario_treinamentos_read_profiles`
- `funcionario_treinamentos_write_profiles`
- `apr_read_profiles`
- `apr_write_profiles`

SST 10.2:

- `apt_read_profiles`
- `apt_write_profiles`
- `inspecoes_read_profiles`
- `inspecoes_write_profiles`
- `ocorrencias_read_profiles`
- `ocorrencias_write_profiles`
- `planos_acao_read_profiles`
- `planos_acao_write_profiles`

## Permissoes Frontend

Perfis conhecidos:

- `operador`
- `tecnico`
- `cco`
- `supervisor`
- `gerencia`
- `diretoria`
- `prefeitura`
- `sst`
- `administrativo`
- `almoxarifado`
- `financeiro`

Fonte atual:

- `src/config/permissions.js`

Observacao:

- Diretoria possui `*`.
- A regra de permissao ainda e predominantemente frontend/localStorage. Para producao, deve ser vinculada a RLS/Auth real.

## Fluxos Operacionais Implementados

- Login e rotas protegidas.
- Dashboard executivo.
- RO do operador.
- Validacao CCO de RO.
- OS da Prefeitura e fluxo tecnico/supervisor/prefeitura.
- Comentarios, anexos e historico de OS.
- PDF de RO e OS.
- Arquivo PDF.
- Almoxarifado com estoque e movimentacoes.
- SST com EPI, treinamento, APR, APT, inspecao, ocorrencia e plano de acao.

## Fluxos Operacionais Pendentes

- CCO de OS.
- OS Diarias dedicadas.
- Manutencao preventiva/preditiva.
- Compras e aprovacao.
- Contratos e medições.
- Administrativo/RH/DP/Frota.
- Central de alertas.
- Central de cadastros mestres.
- Relatorios consolidados.
- Busca global/portal unico completo.
