# Relatório de Auditoria de Encoding do SIGEBAP

Data: 03/07/2026

## Resumo executivo

Foi realizada uma auditoria completa de encoding nos arquivos do projeto e nos dados acessíveis do Supabase. O problema estava nos textos já gravados nos arquivos fonte, documentação e SQL como conteúdo corrompido, não na geração de PDF nem na configuração principal do Vite.

O `index.html` já utiliza `<meta charset="UTF-8" />`, e a varredura final confirmou que os arquivos analisados estão em UTF-8 sem BOM e sem caracteres inválidos.

## Origem identificada

- Os arquivos estavam tecnicamente legíveis como UTF-8, mas várias strings já haviam sido salvas com texto corrompido.
- A origem mais provável é conteúdo copiado ou convertido anteriormente a partir de editores externos, PDFs, Word, planilhas ou saídas de terminal com codificação diferente.
- Não foi identificado problema estrutural no Vite, no Node, no `index.html` ou na configuração de charset do navegador.
- Também foi identificado um efeito colateral de correção automática: alguns nomes técnicos chegaram a ser acentuados. Esses casos foram revertidos para manter rotas, imports, colunas e tabelas sem acento.

## Arquivos corrigidos

Foram aplicadas correções em 70 arquivos de aplicação, documentação e banco:

- `AUDITORIA_FINAL.md`
- `GAP_ANALYSIS.md`
- `INVENTARIO_PROJETO.md`
- `MODULOS_PENDENTES.md`
- `ROADMAP_PRODUCAO.md`
- `database/indexes.sql`
- `database/migrations/20260621_fase21_financeiro_contratos.sql`
- `database/migrations/20260621_fase21_financeiro_contratos_rls.sql`
- `database/migrations/20260623_supervisao_por_area.sql`
- `database/migrations/20260623_usuario_area_operacional.sql`
- `database/migrations/20260624_modelos_relatorios_dinamicos.sql`
- `database/migrations/20260625_auto_cadastro_tecnicos.sql`
- `database/migrations/20260629_comunicacao_operacional.sql`
- `database/rls.sql`
- `database/schema.sql`
- `database/seed.sql`
- `docs/09-Modulos.md`
- `src/components/financeiro/FinanceiroDashboard.jsx`
- `src/components/financeiro/FinanceiroFilters.jsx`
- `src/components/financeiro/FinanceiroForms.jsx`
- `src/components/financeiro/FinanceiroTables.jsx`
- `src/components/layout/AppLayout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Topbar.jsx`
- `src/components/manutencao/ManutencaoCalendario.jsx`
- `src/components/manutencao/ManutencaoDashboard.jsx`
- `src/components/os-diaria/OsDiariaDashboard.jsx`
- `src/components/os/RelatorioTecnicoDinamico.jsx`
- `src/components/pdf/PdfTemplate.jsx`
- `src/components/relatorio/RelatorioCCO.jsx`
- `src/components/supervisao/SupervisaoActionModal.jsx`
- `src/components/supervisao/SupervisaoFilters.jsx`
- `src/components/supervisao/SupervisaoQueue.jsx`
- `src/config/permissions.js`
- `src/data/relatorioGerencialEbaps.js`
- `src/pages/AgendaOperacional.jsx`
- `src/pages/Ativos.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/DetalheOS.jsx`
- `src/pages/FinanceiroContratos.jsx`
- `src/pages/LocalizacaoEbaps.jsx`
- `src/pages/MeuPerfil.jsx`
- `src/pages/ModelosRelatorioAdmin.jsx`
- `src/pages/OrdensServico.jsx`
- `src/pages/RelatorioDiario.jsx`
- `src/pages/SalaSituacao.jsx`
- `src/pages/SalaSituacaoTV.jsx`
- `src/pages/Supervisao.jsx`
- `src/pages/Usuarios.jsx`
- `src/routes/AppRoutes.jsx`
- `src/services/agendaOperacionalService.js`
- `src/services/authService.js`
- `src/services/comunicacaoService.js`
- `src/services/dashboardService.js`
- `src/services/financeiroService.js`
- `src/services/globalSearchService.js`
- `src/services/manutencaoService.js`
- `src/services/modelosRelatorioAdminService.js`
- `src/services/osDiariaService.js`
- `src/services/osService.js`
- `src/services/relatorioService.js`
- `src/services/relatorioTecnicoService.js`
- `src/services/salaSituacaoService.js`
- `src/services/supervisaoService.js`
- `src/services/usuariosService.js`
- `src/store/financeiroStore.js`
- `src/store/notificacoesStore.js`
- `src/store/supervisaoStore.js`
- `tools/capture_sigebap_screenshots.js`

## Registros do Supabase

A auditoria consultou 62 tabelas usadas pelo sistema.

Resultado:

- Registros com texto corrompido encontrados: 0
- Registros corrigidos no banco: 0
- Tabelas bloqueadas por permissão: 0

Conclusão: não havia dados corrompidos gravados no Supabase nos registros acessíveis pela aplicação.

## Quantidade de textos afetados

- Correções locais aplicadas: 656 substituições
- Arquivos finais verificados: 260
- Arquivos com BOM: 0
- Arquivos inválidos em UTF-8: 0
- Ocorrências restantes de texto corrompido: 0

## Validação final

Foi executada nova auditoria após as correções:

- Nenhuma ocorrência restante dos padrões de texto corrompido.
- Nenhum arquivo com BOM.
- Nenhum arquivo inválido em UTF-8.
- Build de produção executada com sucesso.

Observação: a build ainda exibe avisos normais de tamanho de pacote e compatibilidade de biblioteca, mas sem erro de encoding.
