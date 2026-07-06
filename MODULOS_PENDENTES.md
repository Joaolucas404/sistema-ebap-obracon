# MODULOS PENDENTES DO SIGEBAP

Data: 20/06/2026  
Escopo: somente itens que ainda nao existem como modulo funcional completo no React/Supabase atual.

## Nao Implementados

### Administrativo/RH/DP/Frota

Rota atual:

- `/administrativo` placeholder

Falta:

- Cadastro administrativo.
- RH/DP.
- Controle de frota.
- Atestados.
- Documentos administrativos.
- Fluxo de solicitacoes internas.
- Relatorios administrativos.

Prioridade: MEDIA

### Prefeitura Fiscalizacao/Contrato/Medições

Rotas atuais:

- `/financeiro-contrato` placeholder
- `/relatorios` placeholder

Falta:

- Contratos em tela real.
- Medições.
- Fiscalizacao.
- Aceite/rejeicao/glosa.
- Anexos de contrato e medicao.
- PDF de medicao.
- Dashboard contratual.

Prioridade: ALTA

### Manutencao Preventiva/Preditiva/Corretiva

Rotas atuais:

- `/manutencao` placeholder
- `/sala-situacao-ebaps` placeholder

Falta:

- Planos preventivos.
- Preditiva.
- Calendario de manutencao.
- Checklists por equipamento.
- Geração recorrente de OS.
- Programacao de equipes.
- Sala de situacao real.

Prioridade: ALTA

### Pedidos de Compra e Aprovacao Gerencial

Rota atual:

- `/compras` placeholder

Falta:

- Pedido de compra.
- Aprovacao por gerencia.
- Aprovacao financeira.
- Cotacao/fornecedor.
- Recebimento.
- Integracao com estoque.
- Historico e notificacoes.

Prioridade: ALTA

## Parcialmente Implementados com Gap Relevante

### CCO de OS

Rota atual:

- `/cco-analise-os` placeholder

Existe:

- CCO de RO.

Falta:

- Validacao de OS geradas pela operacao.
- Fila de OS para CCO.
- Aprovar/rejeitar/devolver OS.
- Historico CCO de OS.

Prioridade: ALTA

### OS Diarias

Rota atual:

- `/os-diaria` placeholder

Existe:

- Tecnico usa `/os` e `/os/:id`.

Falta:

- Roteiro diario por tecnico.
- Filtro por data/turno.
- Lista dedicada de execucao.
- Checklists diarios.

Prioridade: ALTA

### Localizacao EBAPs

Rota atual:

- `/localizacao-ebaps` placeholder

Falta:

- Mapa.
- Coordenadas.
- Links externos.
- Status operacional por unidade no mapa.

Prioridade: MEDIA

### Acervo do Operador

Rota atual:

- `/acervo-operador` placeholder

Existe:

- RO e OS ja possuem dados.

Falta:

- Tela de historico por operador.
- Filtros por periodo, EBAP, status.
- PDFs gerados.

Prioridade: MEDIA

### Relatorios Consolidados

Rota atual:

- `/relatorios` placeholder

Falta:

- Relatorios por periodo.
- Exportacao.
- Consolidado de RO.
- Consolidado de OS.
- Consolidado por EBAP.
- Consolidado financeiro/contratual quando existir.

Prioridade: MEDIA

### Central de Alertas/Notificacoes

Rota atual:

- Sem rota dedicada.

Existe:

- Tabela `notificacoes`.
- Geracao pontual em CCO/OS.

Falta:

- Tela de central de alertas.
- Badge visual.
- Marcar como lida.
- Filtros.
- Regras globais por modulo.

Prioridade: ALTA

### Central de Cadastros Mestres

Rotas atuais:

- `/config` parcial.
- `/usuarios` implementado.

Falta:

- EBAPs editaveis.
- Equipamentos editaveis.
- Areas.
- Equipes.
- Turnos.
- Fornecedores.
- Centros de custo.
- Perfis/permissoes via banco.

Prioridade: MEDIA

### Almoxarifado - Compras e Emprestimo

Rota atual:

- `/almoxarifado` implementada para estoque.

Falta:

- Emprestimo de ferramentas completo.
- Compra integrada.
- Recebimento de compra alimentando estoque.
- Baixa por OS com material utilizado.

Prioridade: ALTA

### SST - Documentos, Certificados e Assinaturas

Rota atual:

- `/sst` implementada.

Falta:

- Upload de certificados.
- Assinatura de entrega de EPI.
- PDF de APR/APT/EPI.
- Dossie por funcionario.

Prioridade: MEDIA

### Portal Unico SIGEBAP

Existe:

- Layout unico e menu.

Falta:

- Busca global.
- Central de tarefas.
- Cards reais de todos os modulos.
- Navegacao executiva consolidada.

Prioridade: ALTA

### Painel Executivo Premium

Existe:

- Dashboard executivo operacional.

Falta:

- Painel premium por diretoria/gerencia.
- Indicadores de compras, contratos, SST, manutencao e financeiro.
- Exportacao executiva.

Prioridade: ALTA

## Pendencias Tecnicas de Producao

### Autenticacao e RLS

Falta:

- Supabase Auth ou RPC segura.
- Claims reais de perfil.
- RLS sem dependencia de `anon` para escrita.
- Storage restrito.
- Auditoria imutavel.

Prioridade: CRITICA

### Qualidade

Falta:

- `eslint.config.js`.
- Testes automatizados.
- Testes e2e.
- Pipeline de build/lint/test.

Prioridade: CRITICA

### Performance

Falta:

- Views/RPCs agregadas para dashboards.
- Indices adicionais por consultas reais.
- Paginacao e cache em modulos com volume alto.

Prioridade: ALTA
