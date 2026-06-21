import { ORIENTACAO_CATEGORIAS, ORIENTACAO_STATUS, ORIENTACAO_TIPOS } from '../../services/orientacoesService.js';

export const blankOrientacao = {
  id: '',
  titulo: '',
  categoria: 'operacao',
  descricao: '',
  conteudo: '',
  tipo: 'orientacao',
  status: 'publicado',
  responsavel: '',
  data_referencia: new Date().toISOString().slice(0, 10)
};

export function mapOrientacaoToForm(item) {
  return {
    id: item.id,
    titulo: item.titulo || '',
    categoria: item.categoria || 'operacao',
    descricao: item.descricao || '',
    conteudo: item.conteudo || '',
    tipo: item.tipo || 'orientacao',
    status: item.status || 'publicado',
    responsavel: item.responsavel || '',
    data_referencia: item.data_referencia || new Date().toISOString().slice(0, 10)
  };
}

export default function OrientacaoForm({ form, saving, canEditStatus = true, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Título
          <input className="form-control" value={form.titulo} onChange={(event) => onChange('titulo', event.target.value)} required minLength={3} />
        </label>
        <label className="field-label">
          Categoria
          <select className="form-control" value={form.categoria} onChange={(event) => onChange('categoria', event.target.value)} required>
            {ORIENTACAO_CATEGORIAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="field-label">
          Tipo
          <select className="form-control" value={form.tipo} onChange={(event) => onChange('tipo', event.target.value)}>
            {ORIENTACAO_TIPOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={form.status} onChange={(event) => onChange('status', event.target.value)} disabled={!canEditStatus}>
            {ORIENTACAO_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Data
          <input className="form-control" type="date" value={form.data_referencia} onChange={(event) => onChange('data_referencia', event.target.value)} />
        </label>
      </div>

      <label className="field-label">
        Responsável
        <input className="form-control" value={form.responsavel} onChange={(event) => onChange('responsavel', event.target.value)} />
      </label>

      <label className="field-label">
        Descrição
        <textarea className="form-control min-h-24 py-3" value={form.descricao} onChange={(event) => onChange('descricao', event.target.value)} required minLength={10} />
      </label>

      <label className="field-label">
        Passo a passo / conteúdo
        <textarea className="form-control min-h-44 py-3" value={form.conteudo} onChange={(event) => onChange('conteudo', event.target.value)} required minLength={10} />
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar orientação'}</button>
      </div>
    </form>
  );
}
