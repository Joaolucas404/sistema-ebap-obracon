import { STATUS_OPTIONS, ALERT_STATUS_VALUES } from '../../services/relatorioService.js';

export default function RelatorioChecklistSection({ title, description, data, onChange, quantityLabel, itemPrefix, maxQuantity = 20, allowQuantityControl = false, extraFields }) {
  const items = data?.items || [];
  const hasQuantityControl = Boolean(allowQuantityControl && quantityLabel && itemPrefix);
  const quantity = Number.isFinite(Number(data?.quantidade)) ? Number(data.quantidade) : items.length;

  function updateItem(index, patch) {
    const next = items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item));
    onChange({ ...data, items: next });
  }

  function updateQuantity(value) {
    const nextQuantity = Number(value);
    const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, Math.min(maxQuantity, nextQuantity)) : 0;
    const nextItems = Array.from({ length: safeQuantity }, (_, index) => ({
      local_id: items[index]?.local_id || itemPrefix.toLowerCase() + '-' + (index + 1),
      ativo_id: items[index]?.ativo_id || null,
      equipamento_id: null,
      nome: items[index]?.nome || itemPrefix + ' ' + String(index + 1).padStart(2, '0'),
      status: items[index]?.status || 'operando',
      observacao: items[index]?.observacao || '',
      diesel: items[index]?.diesel || '',
      solicitar_os: Boolean(items[index]?.solicitar_os)
    }));

    onChange({ ...data, quantidade: safeQuantity, items: nextItems });
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
      {hasQuantityControl && (
        <label className="field-label mb-4 max-w-xs">
          {quantityLabel}
          <select className="form-control" value={quantity} onChange={(event) => updateQuantity(event.target.value)}>
            {Array.from({ length: maxQuantity + 1 }, (_, index) => (
              <option key={index} value={index}>{index}</option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-3">
        {items.length ? (
          items.map((item, index) => {
            const needsReason = ALERT_STATUS_VALUES.includes(item.status);
            return (
              <div key={item.ativo_id || item.equipamento_id || item.local_id || index} className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate text-white">{item.nome}</strong>
                    {item.tipo && <small className="text-slate-400">{item.tipo}</small>}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        className={[
                          'min-h-11 rounded-2xl border px-3 text-sm font-black transition',
                          item.status === status.value ? statusButtonActive(status.tone) : 'border-cyan-300/15 bg-navy-950/40 text-slate-300 hover:bg-cyan-300/10'
                        ].join(' ')}
                        type="button"
                        onClick={() => updateItem(index, { status: status.value, observacao: status.value === 'operando' ? '' : item.observacao })}
                      >
                        <span className={['mr-2 inline-block h-2.5 w-2.5 rounded-full', statusDot(status.tone)].join(' ')} />
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                {extraFields?.(item, index, updateItem)}
                {needsReason && (
                  <label className="field-label">
                    Motivo obrigatório
                    <textarea
                      className="form-control min-h-20 py-3"
                      value={item.observacao || ''}
                      onChange={(event) => updateItem(index, { observacao: event.target.value })}
                      required
                    />
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <input type="checkbox" checked={Boolean(item.solicitar_os)} onChange={(event) => updateItem(index, { solicitar_os: event.target.checked })} />
                  Gerar OS
                </label>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-5 text-sm text-slate-300">
            {hasQuantityControl ? 'Selecione a quantidade para preencher esta etapa.' : 'Nenhum equipamento cadastrado nesta categoria para a EBAP selecionada.'}
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

function statusButtonActive(tone) {
  const map = {
    green: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100',
    yellow: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
    red: 'border-red-300/40 bg-red-400/15 text-red-100',
    blue: 'border-sky-300/40 bg-sky-400/15 text-sky-100'
  };
  return map[tone] || map.green;
}

function statusDot(tone) {
  const map = { green: 'bg-emerald-300', yellow: 'bg-amber-300', red: 'bg-red-300', blue: 'bg-sky-300' };
  return map[tone] || map.green;
}
