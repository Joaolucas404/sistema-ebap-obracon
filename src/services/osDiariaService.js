import { supabase } from '../lib/supabase.js';
import { listarSstVinculosOS } from './sstService.js';
import { OS_AREAS, OS_PRIORIDADES, areaLabel, prioridadeLabel, statusLabel } from './osService.js';

export { OS_AREAS, OS_PRIORIDADES, areaLabel, prioridadeLabel, statusLabel };

export const OS_DIARIA_PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'amanha', label: 'Amanha' },
  { value: 'semana', label: 'Semana' }
];

export const OS_DIARIA_TURNOS = [
  { value: 'diurno', label: 'Diurno' },
  { value: 'noturno', label: 'Noturno' }
];

export const CHECKLIST_OS_DIARIA = {
  mecanica: ['Bloqueio mecanico verificado', 'Ferramentas conferidas', 'Fixacoes e acoplamentos revisados', 'Teste funcional realizado'],
  eletrica: ['Desenergizacao/LOTO verificada', 'Cabos e conexoes inspecionados', 'Painel conferido', 'Teste eletrico registrado'],
  automacao: ['Sinais de campo testados', 'Comunicacao validada', 'Intertravamentos conferidos', 'Alarmes verificados'],
  operacional: ['Condicao operacional registrada', 'Area isolada e sinalizada', 'Equipamento testado', 'Operacao normalizada'],
  civil: ['Area isolada', 'Estrutura inspecionada', 'Limpeza executada', 'Risco residual avaliado'],
  hidraulica: ['Valvulas conferidas', 'Vazamentos verificados', 'Pressao/fluxo avaliados', 'Teste operacional realizado'],
  outros: ['Condicoes iniciais registradas', 'Atividade executada', 'Teste final realizado', 'Pendencias registradas']
};

const OS_SELECT = `
  *,
  ebap:ebaps(id,codigo,nome,nome_curto,status),
  solicitante:usuarios!ordens_servico_solicitante_id_fkey(id,nome,usuario,perfil,setor),
  responsavel:usuarios!ordens_servico_responsavel_id_fkey(id,nome,usuario,perfil,setor)
`;

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function periodRange(periodo) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (periodo === 'amanha') {
    start.setDate(start.getDate() + 1);
    end.setDate(start.getDate());
  }

  if (periodo === 'semana') {
    end.setDate(start.getDate() + 6);
  }

  return { start: dateOnly(start), end: dateOnly(end) };
}

function applyScope(query, user) {
  if (['supervisor', 'gerencia', 'diretoria'].includes(user?.perfil)) return query;
  if (user?.perfil === 'tecnico') {
    const base = query.or(`responsavel_id.eq.${user?.id},tecnico_responsavel.eq.${user?.id},responsavel_id.is.null`);
    return user.area_operacional ? base.eq('area', user.area_operacional) : base;
  }
  return query.or(`responsavel_id.eq.${user?.id},responsavel_id.is.null`);
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function osExigeSst(os) {
  return ['mecanica', 'eletrica', 'automacao'].includes(os?.area) && ['alta', 'urgente', 'critica'].includes(os?.prioridade);
}

export async function listarOsDiarias(filters = {}, user) {
  const { start, end } = periodRange(filters.periodo || 'hoje');

  let query = supabase
    .from('ordens_servico')
    .select(OS_SELECT)
    .is('deleted_at', null)
    .in('status', ['programada', 'encaminhada_tecnicos', 'em_execucao', 'pausada', 'concluida_tecnicos'])
    .gte('data_programada', start)
    .lte('data_programada', end)
    .order('data_programada', { ascending: true })
    .order('hora_programada', { ascending: true, nullsFirst: false });

  query = applyScope(query, user);

  if (filters.turno) query = query.ilike('turno', `%${filters.turno}%`);
  if (filters.area) query = query.eq('area', filters.area);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function obterDashboardOsDiarias(user) {
  const hoje = dateOnly(new Date());
  let query = supabase
    .from('ordens_servico')
    .select('id,status,data_programada,responsavel_id,prioridade,deleted_at')
    .is('deleted_at', null);

  query = applyScope(query, user);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];
  return {
    programadasHoje: rows.filter((os) => os.data_programada === hoje && ['programada', 'encaminhada_tecnicos'].includes(os.status)).length,
    concluidasHoje: rows.filter((os) => os.data_programada === hoje && os.status === 'concluida_tecnicos').length,
    emExecucao: rows.filter((os) => os.status === 'em_execucao').length,
    atrasadas: rows.filter((os) => os.data_programada && os.data_programada < hoje && !['concluida_tecnicos', 'concluida_arquivada', 'cancelada'].includes(os.status)).length
  };
}

export async function listarItensAlmoxOsDiaria() {
  const { data, error } = await supabase
    .from('almoxarifado_itens')
    .select('id,codigo,nome,categoria,unidade,estoque_atual')
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('nome');

  if (error) throw error;
  return data || [];
}

export async function listarHistoricoOsDiaria(osId) {
  const { data, error } = await supabase
    .from('os_historico')
    .select('*, usuario:usuarios!os_historico_usuario_id_fkey(id,nome,usuario,perfil)')
    .eq('os_id', osId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function listarAnexosOsDiaria(osId) {
  const { data, error } = await supabase
    .from('anexos')
    .select('*')
    .eq('entidade_tipo', 'ordem_servico')
    .eq('entidade_id', osId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function buscarDetalheOsDiaria(osId) {
  const { data: os, error } = await supabase.from('ordens_servico').select(OS_SELECT).eq('id', osId).single();
  if (error) throw error;

  const [historico, anexos, sst] = await Promise.all([
    listarHistoricoOsDiaria(osId),
    listarAnexosOsDiaria(osId),
    listarSstVinculosOS(osId)
  ]);

  return { os, historico, anexos, sst };
}

export async function movimentarOsDiaria(payload, user) {
  if (!user?.id || !['tecnico', 'supervisor', 'gerencia', 'diretoria'].includes(user?.perfil)) {
    throw new Error('Usuario sem permissao para executar OS diaria.');
  }

  const { data, error } = await supabase.rpc('os_diaria_movimentar', {
    p_user_id: user.id,
    p_os_id: payload.osId,
    p_acao: payload.acao,
    p_checklist: payload.checklist || [],
    p_materiais: payload.materiais || [],
    p_observacao: payload.observacao || null
  });

  if (error) throw error;
  return data;
}

export async function uploadFotoOsDiaria(osId, file, categoria, user) {
  if (!file) throw new Error('Selecione uma foto.');
  if (!categoria) throw new Error('Informe a categoria da foto.');

  const safeName = file.name.replace(/[^\w.-]+/g, '-');
  const path = `${osId}/os-diaria-${categoria}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('service-order-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('anexos')
    .insert({
      entidade_tipo: 'ordem_servico',
      entidade_id: osId,
      bucket: 'service-order-files',
      path,
      nome_original: file.name,
      mime_type: file.type || null,
      tamanho_bytes: file.size || null,
      legenda: `Foto ${categoria} da execucao diaria`,
      categoria: `os_diaria_${categoria}`,
      uploaded_by: user?.id || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
