import ManutencaoStatusBadge from './ManutencaoStatusBadge.jsx';

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function ManutencaoCalendario({ planos, execucoes }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });

  const itemsByDay = [...planos.map((plano) => ({ kind: 'Plano', date: plano.proxima_execucao, label: plano.codigo, status: plano.tipo })), ...execucoes.map((execucao) => ({ kind: 'Execucao', date: execucao.data_programada, label: execucao.plano?.codigo || 'Execucao', status: execucao.status }))].reduce((acc, item) => {
    if (!item.date) return acc;
    acc[item.date] = [...(acc[item.date] || []), item];
    return acc;
  }, {});

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Calendario mensal</h3>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((label) => <div key={label}>{label}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === month;
          const items = itemsByDay[key] || [];
          return (
            <div key={key} className={`min-h-28 rounded-2xl border p-2 text-left ${inMonth ? 'border-cyan-300/15 bg-navy-950/35' : 'border-white/5 bg-navy-950/15 opacity-50'}`}>
              <span className="text-xs font-black text-slate-300">{day.getDate()}</span>
              <div className="mt-2 grid gap-1">
                {items.slice(0, 3).map((item, index) => (
                  <div key={`${item.kind}-${item.label}-${index}`} className="truncate rounded-lg bg-cyan-300/10 px-2 py-1 text-[11px] font-bold text-cyan-100">
                    {item.label}
                  </div>
                ))}
                {items.length > 3 && <span className="text-[11px] font-bold text-slate-400">+{items.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ManutencaoStatusBadge value="preventiva" />
        <ManutencaoStatusBadge value="preditiva" />
        <ManutencaoStatusBadge value="corretiva" />
        <ManutencaoStatusBadge value="atrasada" />
      </div>
    </section>
  );
}
