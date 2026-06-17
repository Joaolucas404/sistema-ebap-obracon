export default function RelatorioCCO({ data, onChange }) {
  function setField(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Comunicação CCO</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Comunicação com CCO
          <select className="form-control" value={data.comunicacao || ''} onChange={(event) => setField('comunicacao', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="instavel">Instável</option>
            <option value="indisponivel">Indisponível</option>
            <option value="nao_testada">Não testada</option>
          </select>
        </label>
        <label className="field-label">
          Supervisório
          <select className="form-control" value={data.supervisao || ''} onChange={(event) => setField('supervisao', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="com_alarmes">Com alarmes</option>
            <option value="indisponivel">Indisponível</option>
          </select>
        </label>
        <label className="field-label md:col-span-2">
          Alarmes e observações
          <textarea className="form-control min-h-28 py-3" value={data.alarmes || ''} onChange={(event) => setField('alarmes', event.target.value)} />
        </label>
        <label className="field-label md:col-span-2">
          Observação do CCO
          <textarea className="form-control min-h-24 py-3" value={data.observacao || ''} onChange={(event) => setField('observacao', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
