import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

export default function RelatorioGeradores({ data, onChange }) {
  const possui = data?.possui || 'nao';

  function setPossui(value) {
    onChange({
      ...data,
      possui: value,
      quantidade: value === 'sim' ? Number(data?.quantidade || 1) : 0,
      items: value === 'sim' ? (data?.items?.length ? data.items : [createGerador(1)]) : []
    });
  }

  function setChecklist(nextData) {
    onChange({ ...nextData, possui: 'sim' });
  }

  return (
    <div className="grid gap-4">
      <section className="glass-card rounded-3xl p-5">
        <h3 className="mb-4 text-xl font-black text-white">Geradores</h3>
        <label className="field-label max-w-sm">
          Esta EBAP possui gerador?
          <div className="grid gap-2 sm:grid-cols-2">
            <button className={possui === 'sim' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setPossui('sim')}>Sim</button>
            <button className={possui === 'nao' ? 'primary-button' : 'secondary-button'} type="button" onClick={() => setPossui('nao')}>Não</button>
          </div>
        </label>
      </section>

      {possui === 'sim' && (
        <RelatorioChecklistSection
          title="Geradores"
          description="Status operacional, nível de diesel e evidência fotográfica na etapa Fotos."
          quantityLabel="Quantidade de geradores"
          itemPrefix="Gerador"
          data={data}
          onChange={setChecklist}
          allowQuantityControl
          maxQuantity={6}
          extraFields={(item, index, updateItem) => (
            <label className="field-label max-w-xs">
              Nível de Diesel (%)
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                value={item.diesel || ''}
                onChange={(event) => updateItem(index, { diesel: event.target.value })}
                required
              />
            </label>
          )}
        />
      )}
    </div>
  );
}

function createGerador(index) {
  return {
    local_id: 'gerador-' + index,
    nome: 'Gerador ' + String(index).padStart(2, '0'),
    status: 'operando',
    diesel: '',
    observacao: '',
    solicitar_os: false
  };
}
