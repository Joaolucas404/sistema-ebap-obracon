import { ALMOX_TIPOS_MOVIMENTACAO } from '../../services/almoxarifadoService.js';

export const blankAlmoxMovement = {
  item_id: '',
  tipo: 'entrada',
  quantidade: '',
  origem: '',
  destino: '',
  os_id: '',
  observacao: ''
};

export default function AlmoxMovementForm({ form, itens, saving, onChange, onSubmit, onCancel }) {
  const itemSelecionado = itens.find((item) => item.id === form.item_id);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label md:col-span-2">
          Item
          <select className="form-control" value={form.item_id} onChange={(event) => onChange('item_id', event.target.value)} required>
            <option value="">Selecione...</option>
            {itens
              .filter((item) => item.ativo)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo} - {item.nome} ({Number(item.estoque_atual || 0)} {item.unidade})
                </option>
              ))}
          </select>
        </label>

        <label className="field-label">
          Tipo
          <select className="form-control" value={form.tipo} onChange={(event) => onChange('tipo', event.target.value)} required>
            {ALMOX_TIPOS_MOVIMENTACAO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Quantidade
          <input
            className="form-control"
            type="number"
            min="0.001"
            step="0.001"
            value={form.quantidade}
            onChange={(event) => onChange('quantidade', event.target.value)}
            required
          />
        </label>

        <label className="field-label">
          Origem
          <input className="form-control" value={form.origem} onChange={(event) => onChange('origem', event.target.value)} maxLength={120} />
        </label>

        <label className="field-label">
          Destino
          <input className="form-control" value={form.destino} onChange={(event) => onChange('destino', event.target.value)} maxLength={120} />
        </label>

        <label className="field-label md:col-span-2">
          OS vinculada
          <input
            className="form-control"
            value={form.os_id}
            onChange={(event) => onChange('os_id', event.target.value)}
            placeholder="UUID da OS para integracao futura, opcional"
          />
        </label>
      </div>

      {itemSelecionado && (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm text-slate-200">
          Saldo atual: <strong className="text-white">{Number(itemSelecionado.estoque_atual || 0)} {itemSelecionado.unidade}</strong>
          {' '}| Estoque mínimo: <strong className="text-white">{Number(itemSelecionado.estoque_minimo || 0)} {itemSelecionado.unidade}</strong>
        </div>
      )}

      <label className="field-label">
        Observacao
        <textarea
          className="form-control min-h-28 resize-y py-3"
          value={form.observacao}
          onChange={(event) => onChange('observacao', event.target.value)}
          maxLength={500}
        />
      </label>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Registrando...' : 'Registrar movimentacao'}
        </button>
      </div>
    </form>
  );
}
