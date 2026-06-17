export default function RelatorioOcorrencias({ data, onChange }) {
  function setField(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Ocorrências</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Houve ocorrência?
          <select className="form-control" value={data.houve || 'nao'} onChange={(event) => setField('houve', event.target.value)}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </label>
        <label className="field-label">
          Prioridade
          <select className="form-control" value={data.prioridade || 'baixa'} onChange={(event) => setField('prioridade', event.target.value)}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </label>
        <label className="field-label md:col-span-2">
          Descrição da ocorrência ou pendência
          <textarea className="form-control min-h-32 py-3" value={data.descricao || ''} onChange={(event) => setField('descricao', event.target.value)} />
        </label>
        <label className="field-label md:col-span-2">
          Conclusão do operador
          <textarea className="form-control min-h-28 py-3" value={data.conclusao || ''} onChange={(event) => setField('conclusao', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
