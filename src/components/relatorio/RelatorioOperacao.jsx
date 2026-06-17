export default function RelatorioOperacao({ data, onChange }) {
  function setField(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Dados Gerais</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Turno
          <select className="form-control" value={data.turno || ''} onChange={(event) => setField('turno', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="diurno">Diurno</option>
            <option value="noturno">Noturno</option>
            <option value="06-18">06:00 às 18:00</option>
            <option value="18-06">18:00 às 06:00</option>
          </select>
        </label>
        <label className="field-label">
          Condição climática
          <select className="form-control" value={data.clima || ''} onChange={(event) => setField('clima', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="chuva">Chuva</option>
            <option value="chuva_intensa">Chuva intensa</option>
            <option value="alerta">Alerta operacional</option>
          </select>
        </label>
        <label className="field-label">
          Nível geral
          <select className="form-control" value={data.nivel_geral || ''} onChange={(event) => setField('nivel_geral', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="elevado">Elevado</option>
            <option value="critico">Crítico</option>
            <option value="baixo">Baixo</option>
          </select>
        </label>
        <label className="field-label md:col-span-2">
          Observação geral
          <textarea className="form-control min-h-28 py-3" value={data.observacao || ''} onChange={(event) => setField('observacao', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
