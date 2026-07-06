import { Plus, Trash2 } from 'lucide-react';
import { COMPRA_AREAS, COMPRA_PRIORIDADES, COMPRA_UNIDADES } from '../../services/comprasService.js';

export const blankCompraItem = {
  almox_item_id: '',
  descricao: '',
  categoria: '',
  unidade: 'un',
  quantidade: 1,
  valor_unitario: 0
};

export const blankCompra = {
  id: '',
  numero: '',
  area: '',
  ebap_id: '',
  justificativa: '',
  prioridade: 'normal',
  prazo_necessario: '',
  itens: [{ ...blankCompraItem }]
};

export function mapCompraToForm(compra) {
  return {
    id: compra.id,
    numero: compra.numero || '',
    area: compra.area || '',
    ebap_id: compra.ebap_id || '',
    justificativa: compra.justificativa || '',
    prioridade: compra.prioridade || 'normal',
    prazo_necessario: compra.prazo_necessario || '',
    itens: compra.itens?.length
      ? compra.itens.map((item) => ({
          almox_item_id: item.almox_item_id || '',
          descricao: item.descricao || '',
          categoria: item.categoria || '',
          unidade: item.unidade || 'un',
            quantidade: item.quantidade ?? 1,
          valor_unitario: item.valor_unitario ?? 0
        }))
      : [{ ...blankCompraItem }]
  };
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CompraForm({ form, ebaps, itensAlmox, saving, onChange, onItemChange, onAddItem, onRemoveItem, onSubmit, onCancel }) {
  const total = (form.itens || []).reduce((sum, item) => sum + Number(item.quantidade || 0) * Number(item.valor_unitario || 0), 0);

  function handleAlmoxItemChange(index, itemId) {
    const selected = itensAlmox.find((item) => item.id === itemId);
    onItemChange(index, 'almox_item_id', itemId);
    if (selected) {
      onItemChange(index, 'descricao', selected.nome);
      onItemChange(index, 'categoria', selected.categoria || '');
      onItemChange(index, 'unidade', selected.unidade || 'un');
      onItemChange(index, 'valor_unitario', selected.custo_medio || 0);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Numero
          <input className="form-control" value={form.numero} placeholder="Automatico se vazio" onChange={(event) => onChange('numero', event.target.value)} />
        </label>
        <label className="field-label">
          Area
          <select className="form-control" required value={form.area} onChange={(event) => onChange('area', event.target.value)}>
            <option value="">Selecione...</option>
            {COMPRA_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          EBAP
          <select className="form-control" value={form.ebap_id} onChange={(event) => onChange('ebap_id', event.target.value)}>
            <option value="">Não vinculada</option>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </select>
        </label>
        <label className="field-label">
          Prioridade
          <select className="form-control" value={form.prioridade} onChange={(event) => onChange('prioridade', event.target.value)}>
            {COMPRA_PRIORIDADES.map((prioridade) => <option key={prioridade.value} value={prioridade.value}>{prioridade.label}</option>)}
          </select>
        </label>
        <label className="field-label md:col-span-2">
          Prazo necessario
          <input className="form-control" type="date" value={form.prazo_necessario} onChange={(event) => onChange('prazo_necessario', event.target.value)} />
        </label>
      </div>

      <label className="field-label">
        Justificativa
        <textarea className="form-control min-h-28 py-3" required minLength={10} value={form.justificativa} onChange={(event) => onChange('justificativa', event.target.value)} />
      </label>

      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-white">Materiais</h4>
            <p className="text-sm text-slate-300">Vincule ao almoxarifado quando o item ja existir.</p>
          </div>
          <button className="secondary-button min-h-10 px-3" type="button" onClick={onAddItem}>
            <Plus size={16} />
            Item
          </button>
        </div>

        <div className="grid gap-3">
          {(form.itens || []).map((item, index) => (
            <div key={`${index}-${item.descricao}`} className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_0.7fr_0.7fr_0.8fr_auto]">
                <label className="field-label">
                  Item almox.
                  <select className="form-control" value={item.almox_item_id} onChange={(event) => handleAlmoxItemChange(index, event.target.value)}>
                    <option value="">Não vinculado</option>
                    {itensAlmox.map((almox) => <option key={almox.id} value={almox.id}>{almox.codigo} - {almox.nome}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Descricao
                  <input className="form-control" required value={item.descricao} onChange={(event) => onItemChange(index, 'descricao', event.target.value)} />
                </label>
                <label className="field-label">
                  Qtde
                  <input className="form-control" type="number" min="0.001" step="0.001" required value={item.quantidade} onChange={(event) => onItemChange(index, 'quantidade', event.target.value)} />
                </label>
                <label className="field-label">
                  Unidade
                  <select className="form-control" value={item.unidade} onChange={(event) => onItemChange(index, 'unidade', event.target.value)}>
                    {COMPRA_UNIDADES.map((unidade) => <option key={unidade} value={unidade}>{unidade}</option>)}
                  </select>
                </label>
                <label className="field-label">
                  Valor unit.
                  <input className="form-control" type="number" min="0" step="0.01" value={item.valor_unitario} onChange={(event) => onItemChange(index, 'valor_unitario', event.target.value)} />
                </label>
                <button className="secondary-button self-end min-h-12 px-3" type="button" onClick={() => onRemoveItem(index)} disabled={(form.itens || []).length <= 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-right text-lg font-black text-white">Total estimado: {formatMoney(total)}</div>
      </section>

      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar solicitacao'}</button>
      </div>
    </form>
  );
}
