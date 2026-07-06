import { ALMOX_UNIDADES } from '../../services/almoxarifadoService.js';

export const blankAlmoxItem = {
  id: null,
  codigo: '',
  nome: '',
  categoria: '',
  unidade: 'un',
  local_id: '',
  estoque_minimo: 0,
  custo_medio: '',
  controlado: false,
  ativo: true
};

export default function AlmoxItemForm({ form, locais, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Codigo
          <input
            className="form-control"
            value={form.codigo}
            onChange={(event) => onChange('codigo', event.target.value)}
            minLength={2}
            maxLength={40}
            required
          />
        </label>

        <label className="field-label">
          Nome do item
          <input
            className="form-control"
            value={form.nome}
            onChange={(event) => onChange('nome', event.target.value)}
            minLength={3}
            maxLength={150}
            required
          />
        </label>

        <label className="field-label">
          Categoria
          <input
            className="form-control"
            value={form.categoria}
            onChange={(event) => onChange('categoria', event.target.value)}
            placeholder="Ex.: Elétrica, Mecânica, EPI"
            minLength={2}
            maxLength={80}
            required
          />
        </label>

        <label className="field-label">
          Unidade
          <select className="form-control" value={form.unidade} onChange={(event) => onChange('unidade', event.target.value)} required>
            {ALMOX_UNIDADES.map((unidade) => (
              <option key={unidade} value={unidade}>
                {unidade}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Local
          <select className="form-control" value={form.local_id || ''} onChange={(event) => onChange('local_id', event.target.value)}>
            <option value="">Sem local definido</option>
            {locais.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Estoque mínimo
          <input
            className="form-control"
            type="number"
            min="0"
            step="0.001"
            value={form.estoque_minimo}
            onChange={(event) => onChange('estoque_minimo', event.target.value)}
            required
          />
        </label>

        <label className="field-label">
          Custo medio
          <input
            className="form-control"
            type="number"
            min="0"
            step="0.01"
            value={form.custo_medio ?? ''}
            onChange={(event) => onChange('custo_medio', event.target.value)}
          />
        </label>

        <div className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <label className="flex items-center gap-3 text-sm font-black text-slate-100">
            <input
              className="size-4 accent-green-500"
              type="checkbox"
              checked={Boolean(form.controlado)}
              onChange={(event) => onChange('controlado', event.target.checked)}
            />
            Item controlado
          </label>
          <label className="flex items-center gap-3 text-sm font-black text-slate-100">
            <input
              className="size-4 accent-green-500"
              type="checkbox"
              checked={form.ativo !== false}
              onChange={(event) => onChange('ativo', event.target.checked)}
            />
            Item ativo
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar item'}
        </button>
      </div>
    </form>
  );
}
