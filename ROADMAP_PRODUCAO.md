# ROADMAP DE PRODUCAO SIGEBAP

Base: GAP Analysis da Fase 11  
Objetivo: ordenar as proximas fases por prioridade real de negocio e risco operacional.

## Fase 11 - Auditoria e Fechamento do Escopo

Status: concluida nesta etapa.

Entregas:

- GAP_ANALYSIS.md.
- INVENTARIO_PROJETO.md.
- MODULOS_PENDENTES.md.
- ROADMAP_PRODUCAO.md.

Resultado esperado:

- Percentual de conclusao definido.
- Lista objetiva de pendencias.
- Ordem de execucao para producao.

## Fase 12 - Hardening de Seguranca e Autenticacao

Prioridade: CRITICA

Motivo:

- A plataforma nao deve ir para producao com autenticacao propria expondo hash de senha e permissoes/RLS desalinhadas.

Escopo:

- Migrar login para Supabase Auth ou RPC segura.
- Remover exposicao de `senha_hash` ao navegador.
- Remover logs de env Supabase.
- Remover fallback de Supabase fake.
- Revisar RLS para `auth.uid()` e claims reais.
- Restringir Storage por perfil/usuario.
- Proteger auditoria contra insert livre.
- Revisar RPCs de exclusao e operacoes criticas.

Dependencias:

- Nenhuma. Deve acontecer antes de piloto/producao.

## Fase 13 - Central de Alertas e Notificacoes

Prioridade: ALTA

Motivo:

- OS, CCO, SST, Estoque e Compras dependem de alerta visual para operar sem perda de prazo.

Escopo:

- Criar tela de notificacoes.
- Badge na topbar/sidebar.
- Marcar como lida.
- Filtros por tipo, perfil, entidade e data.
- Alertas automáticos para OS, RO, CCO, SST, estoque minimo, vencimentos e planos atrasados.

Dependencias:

- RLS corrigida.
- Tabela `notificacoes`.

## Fase 14 - Compras e Aprovacao Gerencial

Prioridade: ALTA

Motivo:

- O ZIP possui modulo de pedidos de compra e aprovacao. Almoxarifado atual ainda nao fecha o ciclo de reposicao.

Escopo:

- Tela `/compras` real.
- Criar pedido de compra.
- Fluxo de aprovacao por gerencia/financeiro.
- Cadastro/seleção de fornecedor.
- Recebimento.
- Integracao com almoxarifado para entrada de estoque.
- Historico e auditoria.

Dependencias:

- Almoxarifado.
- Fornecedores.
- Notificacoes.

## Fase 15 - Manutencao Preventiva, Preditiva e Corretiva

Prioridade: ALTA

Motivo:

- Hoje OS cobre corretiva operacional, mas o modulo 14 do ZIP exige manutencao planejada.

Escopo:

- Tela `/manutencao` real.
- Planos preventivos por equipamento/EBAP.
- Calendario de manutencao.
- Geração recorrente de OS.
- Checklists por area: mecanica, eletrica, automacao, limpeza, operacao.
- Indicadores de backlog e cumprimento.

Dependencias:

- Cadastros de equipamentos.
- OS.
- Almoxarifado.
- Programacao de equipes.

## Fase 16 - OS Diarias e Programacao de Equipes

Prioridade: ALTA

Motivo:

- Tecnicos precisam de uma tela operacional diaria, nao apenas a listagem geral de OS.

Escopo:

- Tela `/os-diaria` real.
- Roteiro do tecnico por data/turno.
- Check-in/check-out ou inicio/fim.
- Equipe responsavel.
- Materiais usados.
- Vinculo com APR/APT obrigatoria quando aplicavel.

Dependencias:

- OS.
- SST.
- Manutencao.

## Fase 17 - Prefeitura Fiscalizacao, Contratos e Medicoes

Prioridade: ALTA

Motivo:

- O modulo 12 do ZIP ainda nao existe como funcionalidade real.

Escopo:

- Tela `/financeiro-contrato` real.
- Contratos.
- Medicoes.
- Fiscalizacao prefeitura.
- Aceite, glosa, anexos e PDFs.
- Dashboard contratual.

Dependencias:

- Arquivo PDF.
- Prefeitura.
- Financeiro.

## Fase 18 - Central de Cadastros Mestres

Prioridade: MEDIA

Motivo:

- O sistema precisa reduzir dependencia de seeds e configuracoes hardcoded.

Escopo:

- EBAPs.
- Equipamentos.
- Areas.
- Equipes.
- Turnos.
- Fornecedores.
- Centros de custo.
- Perfis/permissoes.

Dependencias:

- Autenticacao/RLS.
- Usuarios.

## Fase 19 - Administrativo, RH, DP e Frota

Prioridade: MEDIA

Motivo:

- Modulo 11 ainda nao existe, mas e menos bloqueante para o nucleo operacional de EBAP.

Escopo:

- Administrativo.
- RH/DP.
- Frota.
- Atestados.
- Documentos.
- Vínculo com arquivo digital.

Dependencias:

- Cadastros mestres.
- Arquivo PDF/documental.

## Fase 20 - CCO de OS e Acervo do Operador

Prioridade: ALTA

Motivo:

- O CCO de RO existe, mas o ZIP tambem especifica validacao de OS geradas pela operacao.

Escopo:

- Tela `/cco-analise-os` real.
- Fluxo de validacao de OS do operador.
- Acervo do operador em `/acervo-operador`.
- Historico por operador.
- Correcoes e notificacoes.

Dependencias:

- OS.
- CCO.
- Notificacoes.

## Fase 21 - Portal Unico, Busca Global e Consolidacao

Prioridade: ALTA

Motivo:

- Fechar a experiencia integrada do SIGEBAP.

Escopo:

- Portal unico com cards reais de modulos.
- Busca global por OS, RO, PDF, EBAP, contrato, compra, SST.
- Central de tarefas.
- Consolidacao de indicadores.
- Ajustes finais de menu por perfil.

Dependencias:

- Modulos principais finalizados.

## Fase 22 - Relatorios Consolidados e BI Operacional

Prioridade: MEDIA

Motivo:

- O ZIP possui relatorios e paineis gerenciais mais amplos que o dashboard atual.

Escopo:

- Tela `/relatorios` real.
- Exportacoes.
- Filtros por periodo, EBAP, modulo, perfil e status.
- Views/RPCs agregadas no Supabase.
- Indicadores executivos e operacionais.

Dependencias:

- Dados reais dos modulos.

## Fase 23 - PDF Avancado, Assinaturas e Arquivo Digital Final

Prioridade: MEDIA

Motivo:

- PDF atual cobre RO/OS, mas o SIGEBAP completo exige rastreabilidade documental ampla.

Escopo:

- PDF para APR/APT, EPI, compras, contratos, medicoes, manutencao.
- Hash criptografico.
- Assinatura digital.
- Versionamento.
- Consulta pelo QR.

Dependencias:

- Arquivo PDF.
- Storage.
- Modulos finalizados.

## Fase 24 - Testes, Performance e Producao

Prioridade: CRITICA

Motivo:

- Antes do go-live, a plataforma precisa de validacao tecnica e operacional.

Escopo:

- ESLint funcionando.
- Testes de fluxo com Playwright.
- Build pipeline.
- Indices e views de performance.
- QA mobile.
- QA RLS.
- Backup/restore.
- Plano de go-live.

Dependencias:

- Fase 12 concluida.
- Modulos prioritarios estabilizados.
