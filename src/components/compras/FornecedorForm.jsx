export const blankFornecedor = {
  id: '',
  nome: '',
  razao_social: '',
  documento: '',
  email: '',
  telefone: '',
  contato: '',
  endereco: '',
  cidade: '',
  uf: '',
  cep: '',
  observacoes: '',
  ativo: true
};

export function mapFornecedorToForm(fornecedor) {
  return {
    id: fornecedor.id,
    nome: fornecedor.nome || '',
    razao_social: fornecedor.razao_social || '',
    documento: fornecedor.documento || '',
    email: fornecedor.email || '',
    telefone: fornecedor.telefone || '',
    contato: fornecedor.contato || '',
    endereco: fornecedor.endereco || '',
    cidade: fornecedor.cidade || '',
    uf: fornecedor.uf || '',
    cep: fornecedor.cep || '',
    observacoes: fornecedor.observacoes || '',
    ativo: fornecedor.ativo !== false
  };
}

export default function FornecedorForm({ form, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Nome fantasia
          <input className="form-control" required minLength={3} value={form.nome} onChange={(event) => onChange('nome', event.target.value)} />
        </label>
        <label className="field-label">
          Razao social
          <input className="form-control" value={form.razao_social} onChange={(event) => onChange('razao_social', event.target.value)} />
        </label>
        <label className="field-label">
          Documento
          <input className="form-control" value={form.documento} onChange={(event) => onChange('documento', event.target.value)} />
        </label>
        <label className="field-label">
          Contato
          <input className="form-control" value={form.contato} onChange={(event) => onChange('contato', event.target.value)} />
        </label>
        <label className="field-label">
          E-mail
          <input className="form-control" type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} />
        </label>
        <label className="field-label">
          Telefone
          <input className="form-control" value={form.telefone} onChange={(event) => onChange('telefone', event.target.value)} />
        </label>
        <label className="field-label md:col-span-2">
          Endereco
          <input className="form-control" value={form.endereco} onChange={(event) => onChange('endereco', event.target.value)} />
        </label>
        <label className="field-label">
          Cidade
          <input className="form-control" value={form.cidade} onChange={(event) => onChange('cidade', event.target.value)} />
        </label>
        <label className="field-label">
          UF
          <input className="form-control" maxLength={2} value={form.uf} onChange={(event) => onChange('uf', event.target.value.toUpperCase())} />
        </label>
        <label className="field-label">
          CEP
          <input className="form-control" value={form.cep} onChange={(event) => onChange('cep', event.target.value)} />
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={form.ativo ? 'true' : 'false'} onChange={(event) => onChange('ativo', event.target.value === 'true')}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </label>
      </div>

      <label className="field-label">
        Observacoes
        <textarea className="form-control min-h-24 py-3" value={form.observacoes} onChange={(event) => onChange('observacoes', event.target.value)} />
      </label>

      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar fornecedor'}</button>
      </div>
    </form>
  );
}
