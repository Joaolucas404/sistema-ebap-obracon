import { supabase } from '../lib/supabase.js';
import { registrarHistoricoOS } from './osService.js';

const MODELO_SELECT = `
  *,
  campos:campos_relatorio(*)
`;

function orderCampos(campos = []) {
  return [...campos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function listarModelosRelatorio({ area = '', tipoManutencao = '', equipamentoTipo = '', search = '' } = {}) {
  let query = supabase
    .from('modelos_relatorio')
    .select(MODELO_SELECT)
    .eq('ativo', true)
    .is('deleted_at', null)
    .order('equipamento_tipo', { ascending: true });

  if (tipoManutencao) query = query.eq('tipo_manutencao', tipoManutencao);
  if (area) query = query.or(`area.eq.${area},area.is.null`);
  if (search) {
    const value = `%${search}%`;
    query = query.or(`titulo.ilike.${value},equipamento_tipo.ilike.${value},resumo.ilike.${value}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((modelo) => ({ ...modelo, campos: orderCampos(modelo.campos) }));
}

export async function obterModeloRelatorio(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('modelos_relatorio')
    .select(MODELO_SELECT)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, campos: orderCampos(data.campos) };
}

export async function buscarRespostaRelatorioOS(osId) {
  if (!osId) return null;
  const { data, error } = await supabase
    .from('respostas_relatorio')
    .select('*, modelo:modelos_relatorio(*)')
    .eq('os_id', osId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function salvarRelatorioTecnicoOS(osId, payload, user, status = 'rascunho') {
  if (!payload?.modelo_id) throw new Error('Selecione o modelo de relatório técnico.');

  const modelo = await obterModeloRelatorio(payload.modelo_id);
  const fotoCampos = modelo.campos.filter((campo) => campo.tipo === 'foto');
  const fotosObrigatorias = fotoCampos.map((campo) => ({
    chave: campo.chave,
    label: campo.label,
    obrigatorio: campo.obrigatorio,
    anexado: Boolean(payload.fotos?.[campo.chave]?.file || payload.respostas?.[campo.chave])
  }));

  const row = {
    os_id: osId,
    modelo_id: payload.modelo_id,
    equipamento_id: payload.equipamento_id || null,
    ativo_id: payload.ativo_id || null,
    ativo_nome: payload.ativo_nome || modelo.equipamento_tipo,
    tipo_manutencao: modelo.tipo_manutencao,
    status,
    respostas: payload.respostas || {},
    fotos_obrigatorias: fotosObrigatorias,
    observacoes: payload.observacoes || null,
    enviado_por: user?.id || null,
    enviado_em: status === 'enviado_supervisor' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('respostas_relatorio')
    .upsert(row, { onConflict: 'os_id,modelo_id' })
    .select('*, modelo:modelos_relatorio(*)')
    .single();

  if (error) throw new Error(error.message);

  await registrarHistoricoOS(osId, {
    usuario_id: user?.id,
    acao: status === 'enviado_supervisor' ? 'relatorio_tecnico_enviado' : 'relatorio_tecnico_rascunho',
    descricao: status === 'enviado_supervisor'
      ? `Relatório técnico ${modelo.titulo} enviado ao Supervisor para validação.`
      : `Rascunho do relatório técnico ${modelo.titulo} salvo.`,
    metadata: {
      modelo_id: modelo.id,
      modelo_codigo: modelo.codigo,
      tipo_manutencao: modelo.tipo_manutencao,
      equipamento_tipo: modelo.equipamento_tipo,
      status
    }
  });

  if (status === 'enviado_supervisor') {
    await supabase.from('notificacoes').insert({
      usuario_id: null,
      perfil_destino: 'supervisor',
      titulo: 'Relatório técnico aguardando validação',
      mensagem: `${modelo.titulo} foi preenchido e enviado pelo técnico.`,
      tipo: 'alerta',
      entidade_tipo: 'ordem_servico',
      entidade_id: osId,
      modulo: 'os',
      prioridade: 'normal',
      acao_url: `/os/${osId}`
    });
  }

  return data;
}

export function resumoRelatorioTecnico(resposta) {
  if (!resposta) return 'Nenhum relatório técnico vinculado.';
  const modelo = resposta.modelo?.titulo || resposta.ativo_nome || 'Relatório técnico';
  return `${modelo} - ${resposta.status?.replaceAll('_', ' ') || 'rascunho'}`;
}
