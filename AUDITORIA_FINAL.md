# AUDITORIA FINAL DA PLATAFORMA EBAPS

Data da auditoria: 20/06/2026  
Escopo: React, Vite, Supabase, permissoes, fluxos operacionais, seguranca, performance e UX.  
Resultado: foram encontrados pontos criticos antes de producao, principalmente em autenticacao, RLS, Storage e configuracao de qualidade.

## Resumo executivo

A plataforma ja possui os principais modulos operacionais estruturados: Dashboard Executivo, Ordens de Servico, Relatorio Diario, Validacao CCO, Usuarios, Arquivo PDF e componentes de identidade visual. A maior parte dos fluxos esta funcional no frontend, com integracao Supabase.

Porem, a aplicacao ainda nao esta pronta para producao. O maior risco esta na seguranca: a autenticacao e feita com tabela propria de usuarios, senha hash trafegando para o navegador, permissoes persistidas em localStorage e politicas RLS amplas com `anon` autorizado em operacoes sensiveis. Isso permite bypass por cliente malicioso mesmo que a tela esconda botoes.

Tambem ha pontos importantes de performance, governanca de dados, lint bloqueado e varios modulos ainda como placeholders.

## 1. React

### CRITICO

1. Autenticacao e perfil sao controlados no cliente.
   - Arquivos: `src/store/authStore.js`, `src/components/auth/ProtectedRoute.jsx`, `src/services/authService.js`
   - O perfil do usuario fica persistido em `localStorage` via Zustand.
   - As permissoes de rota usam `ROLE_PERMISSIONS` no frontend.
   - Risco: usuario pode adulterar storage local e tentar acessar rotas ou chamar services diretamente.
   - Correcao recomendada: migrar autenticacao para Supabase Auth ou emitir JWT confiavel com claims de perfil, usando RLS real no banco.

2. Hash de senha e validacao de senha ocorrem no navegador.
   - Arquivo: `src/services/authService.js`
   - Linha relevante: `.select('*')` carrega `senha_hash`.
   - Linha relevante: `bcrypt.compare(senha, data.senha_hash)`.
   - Risco: hashes de senha ficam expostos ao cliente.
   - Correcao recomendada: usar Supabase Auth ou RPC segura com `security definer`, sem expor `senha_hash`.

3. Variaveis Supabase sao exibidas no console.
   - Arquivo: `src/lib/supabase.js`
   - Linhas relevantes: `console.log(import.meta.env.VITE_SUPABASE_URL)` e `console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)`.
   - Risco: exposicao desnecessaria da chave anon e URL no browser.
   - Correcao recomendada: remover logs e validar env obrigatoria no startup.

### IMPORTANTE

1. `src/lib/supabase.js` possui fallback para `https://example.supabase.co` e `anon-key`.
   - Risco: erro de configuracao pode passar despercebido em build/local.
   - Correcao recomendada: falhar explicitamente quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` nao existirem.

2. ESLint nao executa.
   - `package.json` tem script `"lint": "eslint ."`.
   - Nao existe `eslint.config.js`.
   - Resultado real: `ESLint couldn't find an eslint.config.(js|mjs|cjs) file`.
   - Correcao recomendada: criar configuracao ESLint 9 com React Hooks e regras basicas antes de producao.

3. Rotas incompletas ainda aparecem como placeholders.
   - Arquivo: `src/routes/AppRoutes.jsx`
   - Exemplos: Almoxarifado, Compras, Financeiro/Contrato, SST, Administrativo, Manutencao, Sala de Situacao, OS Diarias.
   - Risco: usuario acessa modulos ainda nao implementados.
   - Correcao recomendada: remover do menu em producao ou sinalizar como modulo indisponivel controlado por feature flag.

4. Rotas duplicadas para OS.
   - `/dashboard-os` e `/os` renderizam `OrdensServico`.
   - Pode ser aceitavel, mas hoje cria duplicidade conceitual entre dashboard de OS e listagem de OS.
   - Correcao recomendada: separar Dashboard de OS da listagem operacional ou unificar menu/rota.

5. `OSEquipmentSelector` permanece no fluxo de edicao.
   - Arquivo: `src/components/os/OSEquipmentSelector.jsx`
   - O cadastro de OS foi simplificado para equipamento com falha em texto livre, mas a edicao ainda pode carregar seletor de equipamentos.
   - Correcao recomendada: padronizar abertura e edicao para o mesmo campo livre, se essa for a regra final.

### MELHORIA FUTURA

1. Componentes CCO, OS, RO e PDF estao razoavelmente separados.
   - Nao foram encontrados componentes claramente duplicados nos grupos principais.
   - Recomendacao: apos corrigir seguranca, criar testes de renderizacao e permissao por perfil.

2. `src/config/permissions.js` tem permissoes hardcoded.
   - O banco possui `perfis`, `permissoes` e `perfil_permissoes`, mas o frontend nao usa essa fonte.
   - Recomendacao: centralizar permissoes no banco ou em claims confiaveis.

## 2. Supabase

### CRITICO

1. RLS depende de JWT claims que a aplicacao nao fornece.
   - Arquivo: `database/rls.sql`
   - Funcoes: `current_app_user_id()` e `current_app_role()`.
   - Elas leem `request.jwt.claim.sub`, `request.jwt.claim.perfil` e `request.jwt.claim.role`.
   - Como o app usa login proprio e chave anon, o papel tende a cair como `anon`.
   - Risco: politicas nao refletem o usuario logado real da aplicacao.
   - Correcao recomendada: usar Supabase Auth com claims de perfil ou trocar o modelo para RPCs seguras.

2. Muitas politicas RLS permitem `anon` em escrita.
   - Arquivo: `database/rls.sql`
   - Exemplos criticos:
     - `usuarios_diretoria_insert`
     - `usuarios_diretoria_update`
     - `relatorios_operador_insert`
     - `relatorios_operador_update`
     - `validacoes_cco_rw`
     - `os_insert_profiles`
     - `os_update_profiles`
   - Risco: cliente anonimo ou adulterado pode criar/alterar dados sensiveis.
   - Correcao recomendada: remover `anon` de operacoes de escrita e aplicar policies por `auth.uid()`/claims reais.

3. Tabela `usuarios` permite leitura ampla para login.
   - Arquivo: `database/rls.sql`
   - Policy: `usuarios_login_read`.
   - Combinado com `.select('*')` em `authService`, expoe `senha_hash`.
   - Correcao recomendada: nunca expor `senha_hash`; autenticar fora do select publico.

4. Storage esta excessivamente permissivo.
   - Arquivo: `database/storage.sql`
   - Policies permitem select, insert, update e delete para buckets do app sem validacao de usuario/perfil.
   - Buckets afetados: `report-photos`, `service-order-files`, `pdf-archive`, `sst-documents`, `inventory-files`, `contract-files`, `purchase-files`.
   - Risco: upload, sobrescrita e exclusao indevida de arquivos.
   - Correcao recomendada: restringir por `auth.role()`, `auth.uid()`, prefixo de pasta e perfil.

5. Auditoria pode ser inserida livremente.
   - Arquivo: `database/rls.sql`
   - Policy: `auditoria_insert_system` usa `with check (true)`.
   - Risco: registros de auditoria podem ser forjados.
   - Correcao recomendada: gravar auditoria por triggers ou RPC `security definer`, sem insert direto do cliente.

### IMPORTANTE

1. Seed de producao contem senha padrao.
   - Arquivo: `database/seed.sql`
   - Usuario `admin` com senha inicial conhecida.
   - Correcao recomendada: exigir troca imediata, remover seed sensivel de producao ou criar bootstrap seguro.

2. Indices ausentes para consultas frequentes.
   - Arquivo: `database/indexes.sql`
   - Recomenda-se adicionar:
     - `ordens_servico(responsavel_id) where deleted_at is null`
     - `ordens_servico(solicitante_id) where deleted_at is null`
     - `ordens_servico(prioridade) where deleted_at is null`
     - `ordens_servico(created_at desc) where deleted_at is null`
     - `relatorios_diarios(operador_id, status, updated_at desc) where deleted_at is null`
     - indices compostos para dashboard por `status`, `prioridade`, `area` e datas.

3. Busca textual usa `ilike` sem indice apropriado.
   - Afeta OS e possiveis filtros em usuarios/relatorios.
   - Correcao recomendada: usar `pg_trgm` e indices GIN para campos pesquisaveis, ou busca full text.

4. Buckets ainda nao usados pelo frontend.
   - `sst-documents`, `inventory-files`, `contract-files`, `purchase-files`.
   - Nao e erro, mas devem ficar bloqueados ate os modulos serem implementados.

5. `archive_documents` possui `updated_at`, mas precisa confirmar trigger de atualizacao.
   - Arquivo: `database/schema.sql`
   - Recomendacao: garantir trigger `set_updated_at` para tabelas com `updated_at`.

### MELHORIA FUTURA

1. Transformar regras de transicao de OS em constraints/RPCs.
   - Hoje o workflow e majoritariamente controlado pelo frontend.
   - Recomendacao: RPC `transition_os_status` validando perfil, status atual, proximo status, motivo e comentario.

2. Criar views ou materialized views para Dashboard Executivo.
   - Evita carregar grandes volumes para calcular indicadores no cliente.

## 3. Permissoes por perfil

### CRITICO

1. Permissoes visuais nao garantem seguranca.
   - Arquivos: `src/config/permissions.js`, `src/components/auth/ProtectedRoute.jsx`, `database/rls.sql`
   - O frontend esconde ou mostra rotas, mas o banco ainda permite varias escritas como `anon`.
   - Impacto: escalada de privilegio por chamada direta ao Supabase.

2. Diretoria como unico perfil de exclusao esta correto no frontend, mas depende de RPC.
   - Arquivos: `src/services/osService.js`, `src/services/usuariosService.js`
   - Funcoes: `soft_delete_os_diretoria`, `soft_delete_usuario_diretoria`.
   - Precisa confirmar no Supabase se as RPCs estao com `security definer` e validacao real de perfil no banco.

### IMPORTANTE

1. Perfil `tecnico` ve OS `encaminhada_tecnicos` mesmo sem responsavel.
   - Arquivo: `src/services/osService.js`
   - Pode ser regra desejada para fila tecnica, mas precisa estar documentada.

2. Perfil `operador` possui acesso a `ccoRelatoriosDiarios`.
   - Arquivo: `src/config/permissions.js`
   - O service limita operador aos proprios relatorios.
   - Recomendacao: confirmar se operador deve acessar tela CCO ou apenas historico dos proprios ROs.

3. Perfis `sst`, `administrativo`, `almoxarifado`, `financeiro` existem, mas os modulos correspondentes ainda nao estao implementados.
   - Recomendacao: bloquear rotas em producao ate implementacao.

### MELHORIA FUTURA

1. Criar matriz oficial de permissoes em documento tecnico.
   - A matriz deve cobrir: visualizar, criar, editar, aprovar, rejeitar, excluir, exportar PDF e anexar arquivos.

## 4. Fluxos

### CRITICO

1. Fluxo Prefeitura/OS nao esta protegido no banco.
   - Arquivos: `src/services/osService.js`, `database/rls.sql`
   - O service implementa transicoes, mas policies permitem update amplo.
   - Risco: status pode ser alterado fora do fluxo oficial.
   - Correcao recomendada: bloquear update direto em `ordens_servico.status` e usar RPC de transicao.

2. Validacao CCO depende de controle do service.
   - Arquivo: `src/services/ccoService.js`
   - Banco permite update de relatorios e insert de validacoes para perfis amplos incluindo `anon`.
   - Risco: relatorio pode ser aprovado/rejeitado indevidamente.

### IMPORTANTE

1. RO salva itens substituindo todos os registros da secao.
   - Arquivo: `src/services/relatorioService.js`
   - Funcao: `salvarItensRelatorio`.
   - Usa delete fisico e insert novamente.
   - Risco: perde granularidade de auditoria, pode gerar custo alto e conflitos.
   - Correcao recomendada: upsert por item ou versionamento.

2. Finalizacao de RO precisa de validacoes mais fortes.
   - Algumas secoes podem ser consideradas completas apenas por possuirem array de itens.
   - Recomendacao: validar obrigatorios por secao antes de finalizar.

3. PDF foi melhorado, mas ainda depende de render HTML no cliente.
   - Arquivos: `src/services/pdfService.js`, `src/components/pdf/PdfTemplate.jsx`
   - Risco: variacao de layout por browser, imagens externas, escala e cortes.
   - Recomendacao: manter testes visuais de PDF e considerar geracao server-side no futuro.

4. Arquivo Digital existe, mas precisa de governanca.
   - Tabelas: `archive_documents`, `arquivo_pdf`.
   - Recomendacao: definir qual tabela e oficial para consulta, hash, trilha de auditoria e retencao.

### MELHORIA FUTURA

1. Criar diagramas tecnicos dos fluxos OS, RO, CCO e PDF.
   - Facilita manutencao e treinamento.

2. Adicionar testes automatizados de fluxo.
   - Casos minimos: abrir OS, programar, tecnico concluir, supervisor validar, prefeitura aprovar/reprovar; criar RO, finalizar, CCO aprovar/rejeitar/corrigir.

## 5. Seguranca

### CRITICO

1. Modelo atual nao deve ir para producao com chave anon + RLS permissiva.
   - A camada visual esta avancada, mas a camada de autorizacao nao esta segura.
   - Prioridade maxima: refazer autenticacao/autorizacao antes de uso real.

2. Exclusoes dependem de RPC, mas politicas amplas ainda permitem outras operacoes indevidas.
   - Mesmo que excluir esteja restrito, updates diretos podem alterar status, responsavel, dados de usuario e validacoes.

3. Upload/delete de arquivos precisa de restricao.
   - Arquivo: `database/storage.sql`
   - Impacto: fotos, anexos de OS e PDFs podem ser manipulados fora do fluxo.

### IMPORTANTE

1. Nao ha validacao centralizada de tamanho/tipo de arquivo no frontend para todos os uploads.
   - Recomendacao: validar MIME, tamanho e extensao no cliente e no Storage/RPC.

2. Logs de auditoria devem ser imutaveis.
   - Recomendacao: negar update/delete em auditoria para todos os perfis de app.

3. Operacoes administrativas de usuarios rodam no cliente.
   - Criacao de senha com bcrypt no browser.
   - Recomendacao: mover para backend/RPC segura.

### MELHORIA FUTURA

1. Adicionar politicas de senha, expiracao de sessao e troca obrigatoria no primeiro login.

2. Adicionar rate limit em login.

## 6. Performance

### IMPORTANTE

1. Dashboard busca muitos registros no cliente.
   - Arquivo: `src/services/dashboardService.js`
   - Usa paginacao interna para carregar colecoes e calcular graficos.
   - Risco: lentidao com aumento de OS/RO.
   - Correcao recomendada: criar views/RPCs agregadas no Supabase.

2. Recharts e listas podem renderizar com dados grandes.
   - Recomendacao: limitar payloads, usar agregacoes e paginação real.

3. Upload e PDF podem bloquear a UI.
   - `html2canvas` + `jsPDF` sao pesados no browser.
   - Recomendacao: loading dedicado e, futuramente, processamento server-side.

4. Falta indice para filtros operacionais.
   - Ver secao Supabase/Indices.

### MELHORIA FUTURA

1. Usar React Query ou camada equivalente para cache, revalidacao e estados de loading.

2. Virtualizar listas grandes de OS, relatorios e auditoria se crescerem muito.

## 7. UX

### IMPORTANTE

1. Ha telas de modulo ainda incompletas.
   - PlaceholderPage cobre varios caminhos.
   - Risco: aparencia de sistema pronto com modulo nao entregue.
   - Recomendacao: ocultar no menu ou exibir status controlado de "em implantacao".

2. Tratamento de erro mostra mensagens tecnicas do Supabase.
   - Exemplo ja visto: constraint SQL, relationship ambiguity, HTTP 400/401.
   - Recomendacao: mapear erros para mensagens operacionais claras.

3. Loading e feedback visual precisam ser padronizados.
   - Existem estados em varias telas, mas nao ha padrao global para loading, erro, vazio e sucesso.

4. Mobile melhorou na sidebar, mas precisa QA por fluxo.
   - Testar OS, detalhe OS, RO stepper, CCO modal, PDF e usuarios em viewport pequena.

### MELHORIA FUTURA

1. Criar guia de componentes UI.
   - Botoes, cards, modais, badges, tabelas, formularios e estados vazios.

2. Adicionar confirmacoes padronizadas para acoes criticas.
   - Excluir usuario, excluir OS, rejeitar RO, devolver OS, aprovar prefeitura.

## 8. Qualidade e build

### CRITICO

1. Lint nao executa por falta de `eslint.config.js`.
   - Comando testado: `npm.cmd run lint`.
   - Resultado: falha antes de analisar os arquivos.
   - Impacto: codigo morto, hooks incorretos e imports inutilizados podem passar sem deteccao.

### IMPORTANTE

1. `vite.config.js` esta simples e correto para React.
   - Arquivo: `vite.config.js`
   - Usa `@vitejs/plugin-react`.
   - Nao ha problema aparente de runtime JSX.

2. React Router mostra warnings de future flags.
   - Nao e bloqueante, mas deve ser tratado antes de upgrade para v7.

3. Dependencia `bcryptjs` no browser gera warning de crypto externalizado.
   - Causa ligada ao login no cliente.
   - Sera resolvido ao mover autenticacao para backend/Supabase Auth.

### MELHORIA FUTURA

1. Adicionar testes unitarios e e2e.
   - Sugestao: Vitest + Testing Library + Playwright.

2. Adicionar pipeline de validacao.
   - `lint`, `build`, testes e checagem de SQL antes de deploy.

## 9. Tabelas e buckets nao utilizados ou parcialmente utilizados

### IMPORTANTE

1. Tabelas modeladas, mas com frontend ausente ou placeholder:
   - Almoxarifado
   - Movimentacoes de estoque
   - Compras
   - Financeiro
   - Contratos
   - Medições
   - SST
   - APR
   - EPI
   - Treinamentos
   - Inspecoes

2. Buckets criados, mas nao usados por fluxos implementados:
   - `sst-documents`
   - `inventory-files`
   - `contract-files`
   - `purchase-files`

### MELHORIA FUTURA

1. Manter tabelas e buckets preparados, mas bloquear acesso ate cada modulo sair do placeholder.

## 10. Recomendacao de ordem de correcao

### Fase 8.1 - Seguranca obrigatoria

Classificacao: CRITICO

1. Remover logs de env Supabase.
2. Remover fallback de Supabase fake.
3. Substituir login por Supabase Auth ou RPC segura.
4. Remover `anon` das policies de escrita.
5. Proteger Storage por usuario/perfil.
6. Fechar insert livre em auditoria.
7. Validar RPCs de exclusao de OS e usuario.

### Fase 8.2 - Workflow no banco

Classificacao: CRITICO

1. Criar RPC de transicao de OS.
2. Criar RPC de validacao CCO.
3. Bloquear update direto de status sensiveis.
4. Auditar automaticamente mudancas criticas.

### Fase 8.3 - Qualidade e performance

Classificacao: IMPORTANTE

1. Criar `eslint.config.js`.
2. Rodar lint e corrigir achados.
3. Criar indices adicionais.
4. Trocar dashboard para views/RPCs agregadas.
5. Padronizar erros/loading.

### Fase 8.4 - UX e acabamento de producao

Classificacao: MELHORIA FUTURA

1. Ocultar modulos placeholder.
2. QA mobile dos fluxos principais.
3. Testes automatizados.
4. Guia visual de componentes.

## Conclusao

A plataforma esta bem avancada funcionalmente, mas ainda deve ser considerada em ambiente de homologacao. O bloqueio principal para producao e seguranca/autorizacao no Supabase. A regra mais importante e: tudo que hoje e decidido apenas pelo frontend precisa ser validado tambem no banco.

Status final da auditoria: NAO APROVADO PARA PRODUCAO sem a Fase 8.1.
