import StatusBadge from '../ui/StatusBadge.jsx';

export default function RelatorioResumo({ relatorio, payload, fotos = [] }) {
  const sections = ['operacao', 'bombas', 'rastelos', 'comportas', 'eletrocentro', 'geradores'];
  const totalItems = sections.reduce((acc, section) => acc + (payload?.[section]?.items?.length || 0), 0);
  const alertas = sections.reduce(
    (acc, section) => acc + (payload?.[section]?.items || []).filter((item) => ['falha', 'parado', 'manutencao'].includes(item.status)).length,
    0
  );
  const osSolicitadas = sections.reduce((acc, section) => acc + (payload?.[section]?.items || []).filter((item) => item.solicitar_os).length, 0);

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Revisão do Relatório</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <Info label="Código" value={relatorio?.codigo || 'Rascunho'} />
        <Info label="Equipamentos avaliados" value={totalItems} />
        <Info label="Alertas" value={alertas} />
        <Info label="Fotos" value={fotos.length} />
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <strong className="text-white">Ocorrências</strong>
          <p className="mt-2 text-sm leading-6 text-slate-300">{payload?.ocorrencias?.descricao || 'Sem ocorrência descrita.'}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <strong className="text-white">Conclusão</strong>
          <p className="mt-2 text-sm leading-6 text-slate-300">{payload?.ocorrencias?.conclusao || 'Sem conclusão informada.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={osSolicitadas ? 'orange' : 'green'}>{osSolicitadas} solicitação(ões) de OS</StatusBadge>
          <StatusBadge tone={alertas ? 'orange' : 'green'}>{alertas} ponto(s) de atenção</StatusBadge>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <small className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}</small>
      <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
}
