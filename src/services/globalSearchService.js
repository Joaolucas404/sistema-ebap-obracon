import { supabase } from '../lib/supabase.js';

const LIMIT = 6;

async function safeQuery(label, pathBuilder, fn) {
  try {
    const { data, error } = await fn();
    if (error) return { label, items: [], error: error.message };
    return { label, items: (data || []).map(pathBuilder) };
  } catch (err) {
    return { label, items: [], error: err.message };
  }
}

export async function buscarGlobal(term) {
  const q = String(term || '').trim();
  if (q.length < 2) return [];
  const like = `%${q}%`;

  const results = await Promise.all([
    safeQuery('Ordens de Serviço', (row) => ({
      id: row.id,
      title: row.numero || row.titulo,
      description: `${row.titulo || ''} ${row.ebap?.nome ? `- ${row.ebap.nome}` : ''}`,
      path: `/os/${row.id}`
    }), () => supabase.from('ordens_servico').select('id,numero,titulo,status,ebap:ebaps(nome)').or(`numero.ilike.${like},titulo.ilike.${like},descricao.ilike.${like},equipamento_falha.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('Relatórios Diários', (row) => ({
      id: row.id,
      title: row.codigo,
      description: `${row.status || ''} ${row.ebap?.nome ? `- ${row.ebap.nome}` : ''}`,
      path: '/relatorio'
    }), () => supabase.from('relatorios_diarios').select('id,codigo,status,ebap:ebaps(nome)').or(`codigo.ilike.${like},status.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('APR/APT', (row) => ({
      id: row.id,
      title: row.codigo || row.atividade,
      description: `${row.tipo || 'APR'} - ${row.status || ''}`,
      path: '/sst'
    }), () => supabase.from('apr').select('id,codigo,atividade,status,tipo').or(`codigo.ilike.${like},atividade.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('Compras', (row) => ({
      id: row.id,
      title: row.numero,
      description: `${row.area || ''} - ${row.status || ''}`,
      path: '/compras'
    }), () => supabase.from('compras').select('id,numero,area,status,justificativa').or(`numero.ilike.${like},area.ilike.${like},justificativa.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('Contratos', (row) => ({
      id: row.id,
      title: row.numero,
      description: row.objeto,
      path: '/financeiro-contrato'
    }), () => supabase.from('contratos').select('id,numero,objeto,status').or(`numero.ilike.${like},objeto.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('Medições', (row) => ({
      id: row.id,
      title: row.numero || row.codigo,
      description: `${row.status || ''} - ${row.competencia_mes || ''}/${row.competencia_ano || ''}`,
      path: '/financeiro-contrato'
    }), () => supabase.from('medicoes').select('id,codigo,numero,status,competencia_mes,competencia_ano,resumo').or(`codigo.ilike.${like},numero.ilike.${like},resumo.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('Funcionários', (row) => ({
      id: row.id,
      title: row.nome,
      description: `${row.cargo || row.funcao || ''} - ${row.setor || ''}`,
      path: '/administrativo'
    }), () => supabase.from('adm_colaboradores').select('id,nome,cargo,setor,status').or(`nome.ilike.${like},matricula.ilike.${like},cargo.ilike.${like},setor.ilike.${like}`).is('deleted_at', null).limit(LIMIT)),
    safeQuery('EBAPs', (row) => ({
      id: row.id,
      title: row.nome,
      description: row.status_operacional || row.status || '',
      path: '/localizacao-ebaps'
    }), () => supabase.from('ebaps').select('id,nome,nome_curto,status,status_operacional').or(`nome.ilike.${like},nome_curto.ilike.${like},codigo.ilike.${like}`).is('deleted_at', null).limit(LIMIT))
  ]);

  return results.filter((group) => group.items.length);
}
