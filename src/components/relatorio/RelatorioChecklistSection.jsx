import { STATUS_OPTIONS } from '../../services/relatorioService.js';

const labels = {
  operando: 'Operando',
  normal: 'Normal',
  parado: 'Parado',
  falha: 'Falha',
  manutencao: 'Manutenção',
  nao_aplicavel: 'Não aplicável'
};

export default function RelatorioChecklistSection({ title, description, data, onChange }) {
  const items = data?.items || [];

  function updateItem(index, patch) {
    const next = items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item));
    onChange({ ...data, items: next });
  }

  function setObservation(value) {
    onChange({ ...data, observacao: value });
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-4">
        <h3 className="text-xl font-black text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
      </div>
      <div className="grid gap-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={item.equipamento_id || index} className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 lg:grid-cols-[1.1fr_190px_1fr_120px] lg:items-center">
              <strong className="text-white">{item.nome}</strong>
              <select className="form-control" value={item.status || ''} onChange={(event) => updateItem(index, { status: event.target.value })}>
                <option value="">Status...</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {labels[status]}
                  </option>
                ))}
              </select>
              <input
                className="form-control"
                value={item.observacao || ''}
                onChange={(event) => updateItem(index, { observacao: event.target.value })}
                placeholder="Observação"
              />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(item.solicitar_os)}
                  onChange={(event) => updateItem(index, { solicitar_os: event.target.checked })}
                />
                Gerar OS
              </label>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-5 text-sm text-slate-300">
            Nenhum equipamento cadastrado nesta categoria para a EBAP selecionada.
          </div>
        )}
      </div>
      <label className="field-label mt-4">
        Observações da etapa
        <textarea className="form-control min-h-24 py-3" value={data?.observacao || ''} onChange={(event) => setObservation(event.target.value)} />
      </label>
    </section>
  );
}
