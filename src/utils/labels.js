const STATUS_LABELS = {
  ATENCAO: 'Atenção',
  CRITICA: 'Crítica',
  OPERANDO: 'Operando',
  aguardando_aprovacao: 'Aguardando aprovação',
  aguardando_supervisor: 'Aguardando Supervisor',
  aguardando_validacao_prefeitura: 'Aguardando validação da Prefeitura',
  analise_supervisor: 'Em análise do Supervisor',
  aprovada: 'Aprovada',
  aprovada_cco: 'Aprovada pelo CCO',
  aprovado: 'Aprovado',
  atencao: 'Atenção',
  cancelada: 'Cancelada',
  cancelado: 'Cancelado',
  concluida: 'Concluída',
  concluida_arquivada: 'Concluída / Arquivada',
  concluida_tecnicos: 'Concluída pelos Técnicos',
  correcao_solicitada: 'Correção solicitada',
  correcao_solicitada_cco: 'Correção solicitada pelo CCO',
  critica: 'Crítica',
  em_analise: 'Em análise',
  em_cotacao: 'Em cotação',
  em_execucao: 'Em execução',
  em_fiscalizacao: 'Em fiscalização',
  em_manutencao: 'Em manutenção',
  enviada: 'Enviada',
  enviada_prefeitura: 'Enviada para Prefeitura',
  encaminhada_tecnicos: 'Encaminhada para Técnicos',
  nao_conforme: 'Não conforme',
  nao_enviada: 'Não enviada',
  pendente_aprovacao: 'Pendente de aprovação',
  pendente_validacao_cco: 'Pendente validação CCO',
  programada: 'Programada',
  rejeitada_cco: 'Rejeitada pelo CCO',
  rascunho: 'Rascunho',
  solicitada: 'Solicitada',
  solicitada_prefeitura: 'Solicitada pela Prefeitura',
  validacao_supervisor: 'Em validação do Supervisor',
  validado_cco: 'Validado CCO'
};

export function labelStatus(value, fallback = '-') {
  if (!value) return fallback;
  const key = String(value);
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return key
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function labelUpper(value, fallback = '-') {
  return labelStatus(value, fallback).toLocaleUpperCase('pt-BR');
}
