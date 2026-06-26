import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

const CONFIG = {
  sensores: { flag: 'sensores_possui', quantity: 'sensores_quantidade', tipo: 'Sensor', label: 'Sensores', singular: 'Sensor' },
  climatizadores: { flag: 'climatizadores_possui', quantity: 'climatizadores_quantidade', tipo: 'Climatizador', label: 'Climatizadores', singular: 'Climatizador' }
};

export default function RelatorioEletrocentro({ data, onChange }) {
  const current = normalizeData(data);

  function setPossui(kind, value) {
    const cfg = CONFIG[kind];
    const existing = itemsByType(current.items, cfg.tipo);
    const quantity = value === 'sim' ? Number(current[cfg.quantity] || existing.length || 1) : 0;
    const generated = value === 'sim' ? ensureItems(existing, cfg.tipo, cfg.singular, quantity) : [];
    onChange({
      ...current,
      [cfg.flag]: value,
      [cfg.quantity]: quantity,
      items: mergeTypeItems(current.items, cfg.tipo, generated)
    });
  }

  function setQuantity(kind, value) {
    const cfg = CONFIG[kind];
    const quantity = Math.max(0, Math.min(50, Number(value) || 0));
    const generated = ensureItems(itemsByType(current.items, cfg.tipo), cfg.tipo, cfg.singular, quantity);
    onChange({
      ...current,
      [cfg.flag]: quantity > 0 ? 'sim' : current[cfg.flag],
      [cfg.quantity]: quantity,
      items: mergeTypeItems(current.items, cfg.tipo, generated)
    });
  }

  function setGroupItems(kind, nextGroup) {
    const cfg = CONFIG[kind];
    onChange({ ...current, items: mergeTypeItems(current.items, cfg.tipo, nextGroup.items || []) });
  }

  function setObservation(value) {
    onChange({ ...current, observacao: value });
  }

  return (
    <div className="grid gap-4">
      <section className="glass-card rounded-3xl p-5">
        <h3 className="text-xl font-black text-white">Eletrocentro</h3>
        <p className="mt-1 text-sm text-slate-300">Sensores e climatizadores podem ser informados mesmo sem inventário completo cadastrado.</p>
      </section>

      <EquipmentQuestion
        title="Sensores"
        question="Esta EBAP possui sensores?"
        value={current.sensores_possui}
        quantity={current.sensores_quantidade}
        quantityLabel="Quantidade de sensores"
        onPossui={(value) => setPossui('sensores', value)}
        onQuantity={(value) => setQuantity('sensores', value)}
      />
      {current.sensores_possui === 'sim' && (
        <RelatorioChecklistSection
          title="Sensores"
          description="Status operacional dos sensores informados para o turno."
          data={{ items: itemsByType(current.items, 'Sensor'), observacao: '' }}
          onChange={(nextData) => setGroupItems('sensores', nextData)}
        />
      )}

      <EquipmentQuestion
        title="Climatizadores"
        question="Esta EBAP possui climatizadores?"
        value={current.climatizadores_possui}
        quantity={current.climatizadores_quantidade}
        quantityLabel="Quantidade de climatizadores"
        onPossui={(value) => setPossui('climatizadores', value)}
        onQuantity={(value) => setQuantity('climatizadores', value)}
      />
      {current.climatizadores_possui === 'sim' && (
        <RelatorioChecklistSection
          title="Climatizadores"
          description="Status operacional dos climatizadores informados para o turno."
          data={{ items: itemsByType(current.items, 'Climatizador'), observacao: '' }}
          onChange={(nextData) => setGroupItems('climatizadores', nextData)}
        />
      )}

      <label className="field-label">
        Observações do Eletrocentro
        <textarea className="form-control min-h-24 py-3" value={current.observacao || ''} onChange={(event) => setObservation(event.target.value)} />
      </label>
    </div>
  );
}

function EquipmentQuestion({ title, question, value, quantity, quantityLabel, onPossui, onQuantity }) {
  return (
    <section className="glass-card rounded-3xl p-5">
      <h4 className="mb-4 text-lg font-black text-white">{title}</h4>
      <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-end">
        <label className="field-label">
          {question}
          <div className="grid gap-2 sm:grid-cols-2">
            <button className={value === 'sim' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => onPossui('sim')}>Sim</button>
            <button className={value === 'nao' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => onPossui('nao')}>Não</button>
          </div>
        </label>
        {value === 'sim' && (
          <label className="field-label">
            {quantityLabel}
            <input className="form-control" type="number" min="0" max="50" value={quantity || 0} onChange={(event) => onQuantity(event.target.value)} />
          </label>
        )}
      </div>
    </section>
  );
}

function normalizeData(data) {
  const items = data?.items || [];
  const sensores = itemsByType(items, 'Sensor');
  const climatizadores = itemsByType(items, 'Climatizador');
  return {
    sensores_possui: data?.sensores_possui || (sensores.length ? 'sim' : 'nao'),
    sensores_quantidade: Number(data?.sensores_quantidade ?? sensores.length) || 0,
    climatizadores_possui: data?.climatizadores_possui || (climatizadores.length ? 'sim' : 'nao'),
    climatizadores_quantidade: Number(data?.climatizadores_quantidade ?? climatizadores.length) || 0,
    items,
    observacao: data?.observacao || ''
  };
}

function itemsByType(items, tipo) {
  return (items || []).filter((item) => item.tipo === tipo);
}

function ensureItems(existing, tipo, singular, quantity) {
  return Array.from({ length: quantity }, (_, index) => ({
    ...(existing[index] || {}),
    local_id: existing[index]?.local_id || tipo.toLowerCase() + '-' + (index + 1),
    ativo_id: existing[index]?.ativo_id || null,
    equipamento_id: null,
    tipo,
    nome: existing[index]?.nome || singular + ' ' + String(index + 1).padStart(2, '0'),
    status: existing[index]?.status || 'operando',
    observacao: existing[index]?.observacao || '',
    solicitar_os: Boolean(existing[index]?.solicitar_os)
  }));
}

function mergeTypeItems(allItems, tipo, replacement) {
  return [...(allItems || []).filter((item) => item.tipo !== tipo), ...replacement];
}
