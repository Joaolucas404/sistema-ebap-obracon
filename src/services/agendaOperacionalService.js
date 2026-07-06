import {
  areaLabel,
  gerarOsDoEventoCronograma,
  listarCronogramaManutencao,
  listarOsManutencao,
  salvarEventoCronograma,
  statusCronogramaLabel
} from './manutencaoService.js';

const FINAL_OS_STATUS = ['concluida_arquivada', 'concluida', 'cancelada', 'rejeitada', 'rejeitada_cco', 'arquivada', 'finalizada'];
const SEM_OS_TIPOS = ['lembrete', 'aviso', 'reuniao', 'treinamento', 'dds', 'feriado', 'visita', 'inspecao', 'auditoria', 'parada programada'];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(base, days) {
  const date = new Date(`${base}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function podeGerarOsAgenda(atividade) {
  if (!atividade || atividade.source !== 'cronograma') return false;
  if (atividade.os_id) return false;
  return !SEM_OS_TIPOS.includes(normalize(atividade.tipo_evento));
}

export function mapEventoToAgenda(evento) {
  return {
    ...evento,
    source: 'cronograma',
    agendaId: `cronograma-${evento.id}`,
    titulo: evento.atividade || 'Atividade sem título',
    horario: String(evento.hora_programada || '').slice(0, 5),
    data: evento.data_programada,
    statusLabel: statusCronogramaLabel(evento.status),
    areaLabel: areaLabel(evento.area),
    origemLabel: evento.origem === 'importacao' ? 'Plano Importado' : evento.origem === 'manual' ? 'Manual' : evento.origem || 'Calendário',
    responsavel: evento.equipe || evento.supervisor_nome || '-',
    descricao: evento.descricao || evento.atividade || '-'
  };
}

export function mapOsToAgenda(os) {
  const date = String(os.data_programada || os.created_at || '').slice(0, 10);
  return {
    ...os,
    source: 'os',
    agendaId: `os-${os.id}`,
    titulo: os.titulo || os.numero || 'Ordem de Serviço',
    atividade: os.titulo || os.numero || 'Ordem de Serviço',
    data: date,
    data_programada: date,
    horario: String(os.hora_programada || '').slice(0, 5),
    ebap: os.ebap?.nome || os.payload?.ebap_texto || '-',
    equipamento: os.ativo?.nome_operacional || os.equipamento?.nome || os.payload?.equipamento_texto || '-',
    equipe: os.equipe_responsavel || os.equipe || '-',
    statusLabel: osStatusLabel(os.status),
    areaLabel: areaLabel(os.area),
    origemLabel: 'OS',
    responsavel: os.equipe_responsavel || os.equipe || '-',
    descricao: os.descricao || os.titulo || '-',
    os_id: os.id,
    os_numero: os.numero
  };
}

export function osStatusLabel(status) {
  const labels = {
    programada: 'Programada',
    encaminhada_tecnicos: 'OS Gerada',
    em_execucao: 'Em Execução',
    pausada: 'Em Execução',
    concluida_tecnicos: 'Concluída',
    concluida: 'Concluída',
    concluida_arquivada: 'Concluída',
    cancelada: 'Cancelada',
    rejeitada: 'Cancelada',
    rejeitada_cco: 'Cancelada'
  };
  return labels[status] || status || '-';
}

export function statusAgendaTone(status, source = 'cronograma') {
  if (source === 'os') {
    if (FINAL_OS_STATUS.includes(status)) return 'green';
    if (['em_execucao', 'pausada', 'concluida_tecnicos'].includes(status)) return 'orange';
    if (['rejeitada', 'rejeitada_cco', 'cancelada'].includes(status)) return 'red';
    return 'cyan';
  }
  const tones = {
    programada: 'cyan',
    os_gerada: 'blue',
    em_execucao: 'orange',
    concluida: 'green',
    reprogramada: 'indigo',
    cancelada: 'red',
    atrasada: 'red'
  };
  return tones[status] || 'cyan';
}

export function filtrarAgendaPorAba(atividades = [], aba = 'hoje') {
  const hoje = todayDate();
  const amanha = addDays(hoje, 1);
  const sete = addDays(hoje, 7);
  const trinta = addDays(hoje, 30);
  return atividades.filter((item) => {
    const data = item.data || item.data_programada;
    const concluida = item.status === 'concluida' || FINAL_OS_STATUS.includes(item.status);
    if (aba === 'hoje') return data === hoje;
    if (aba === 'amanha') return data === amanha;
    if (aba === '7dias') return data >= hoje && data <= sete && !concluida;
    if (aba === '30dias') return data >= hoje && data <= trinta && !concluida;
    if (aba === 'atrasadas') return data < hoje && !concluida && !['cancelada', 'reprogramada'].includes(item.status);
    if (aba === 'concluidas') return concluida;
    return true;
  });
}

export function calcularKpisAgenda(eventos = [], osRows = []) {
  const hoje = todayDate();
  const fimSemana = addDays(hoje, 7);
  const eventosAtivos = eventos.filter((item) => !['cancelada', 'concluida'].includes(item.status));
  const osAtivas = osRows.filter((os) => !FINAL_OS_STATUS.includes(os.status));
  return {
    hoje: eventosAtivos.filter((item) => item.data_programada === hoje).length,
    atrasadas: eventosAtivos.filter((item) => item.data_programada < hoje || item.status === 'atrasada').length,
    osEmAndamento: osAtivas.filter((os) => ['em_execucao', 'pausada', 'concluida_tecnicos'].includes(os.status)).length,
    aguardandoSupervisor: osAtivas.filter((os) => ['aguardando_supervisor', 'validacao_supervisor', 'pendente_supervisor'].includes(os.status)).length,
    concluidasHoje: osRows.filter((os) => FINAL_OS_STATUS.includes(os.status) && String(os.fim_execucao || os.updated_at || '').startsWith(hoje)).length,
    semana: eventosAtivos.filter((item) => item.data_programada >= hoje && item.data_programada <= fimSemana).length
  };
}

export async function carregarAgendaOperacional(user, filters = {}) {
  const [eventos, osRows] = await Promise.all([
    listarCronogramaManutencao(user, filters),
    listarOsManutencao(500, user)
  ]);
  const atividades = [
    ...eventos.map(mapEventoToAgenda),
    ...osRows.filter((os) => os.data_programada && !FINAL_OS_STATUS.includes(os.status)).map(mapOsToAgenda)
  ].sort((a, b) => `${a.data || ''} ${a.horario || '99:99'}`.localeCompare(`${b.data || ''} ${b.horario || '99:99'}`));
  return {
    eventos,
    osRows,
    atividades,
    kpis: calcularKpisAgenda(eventos, osRows)
  };
}

export async function atualizarStatusAtividadeAgenda(atividade, status, user) {
  if (atividade.source !== 'cronograma') return null;
  return salvarEventoCronograma({ ...atividade, status }, user);
}

export async function gerarOsAtividadeAgenda(atividade, user) {
  if (atividade.source !== 'cronograma') return null;
  return gerarOsDoEventoCronograma(atividade, user);
}
