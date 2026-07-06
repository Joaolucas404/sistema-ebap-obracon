import { Plus, Trash2, Upload } from 'lucide-react';
import { CHECKLIST_OS_DIARIA, osExigeSst } from '../../services/osDiariaService.js';

export default function OsDiariaExecucaoModal({
  os,
  action,
  form,
  itens,
  sst,
  saving,
  onChange,
  onChecklistChange,
  onMaterialChange,
  onAddMaterial,
  onRemoveMaterial,
  onPhotoChange,
  onSubmit,
  onCancel
}) {
  if (!os || !action) return null;

  const checklist = CHECKLIST_OS_DIARIA[os.area] || CHECKLIST_OS_DIARIA.outros;
  const requiresFull = action === 'concluir';
  const sstOk = (sst?.aprs?.length || 0) > 0 || (sst?.apts?.length || 0) > 0;
  const requiresSst = osExigeSst(os);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h3 className="text-xl font-black text-white">{actionLabel(action)} - {os.numero}</h3>
        <p className="text-sm text-slate-300">{os.titulo}</p>
      </div>

      {requiresSst && (
        <div className={`rounded-2xl border p-4 text-sm font-bold ${sstOk ? 'border-green-300/30 bg-green-500/15 text-green-100' : 'border-red-300/30 bg-red-500/15 text-red-100'}`}>
          Esta OS exige APR/APT liberada. Status SST: {sstOk ? 'documento vinculado' : 'pendente de APR/APT'}.
        </div>
      )}

      {(action === 'iniciar' || requiresFull) && (
        <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <h4 className="mb-3 font-black text-white">Checklist de execução</h4>
          <div className="grid gap-2">
            {checklist.map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-xl bg-navy-950/45 p-3 text-sm font-bold text-slate-200">
                <input type="checkbox" checked={Boolean(form.checklist?.includes(item))} onChange={(event) => onChecklistChange(item, event.target.checked)} />
                {item}
              </label>
            ))}
          </div>
        </section>
      )}

      {requiresFull && (
        <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-black text-white">Materiais utilizados</h4>
            <button className="secondary-button min-h-10 px-3" type="button" onClick={onAddMaterial}>
              <Plus size={16} />
              Material
            </button>
          </div>
          <div className="grid gap-3">
            {(form.materiais || []).map((material, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_130px_auto]">
                <select className="form-control" value={material.item_id} onChange={(event) => onMaterialChange(index, 'item_id', event.target.value)}>
                  <option value="">Selecione item do almoxarifado</option>
                  {itens.map((item) => <option key={item.id} value={item.id}>{item.codigo} - {item.nome} ({item.estoque_atual} {item.unidade})</option>)}
                </select>
                <input className="form-control" type="number" min="0.001" step="0.001" value={material.quantidade} onChange={(event) => onMaterialChange(index, 'quantidade', event.target.value)} placeholder="Qtde" />
                <button className="secondary-button min-h-12 px-3" type="button" onClick={() => onRemoveMaterial(index)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {requiresFull && (
        <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
          <h4 className="mb-3 font-black text-white">Fotos</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {['antes', 'durante', 'depois'].map((tipo) => (
              <label key={tipo} className="field-label">
                {tipo}
                <span className="form-control flex items-center gap-2 py-3">
                  <Upload size={16} />
                  <input className="min-w-0 text-xs" type="file" accept="image/*" onChange={(event) => onPhotoChange(tipo, event.target.files?.[0] || null)} />
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <label className="field-label">
        Observacao
        <textarea className="form-control min-h-28 py-3" value={form.observacao} onChange={(event) => onChange('observacao', event.target.value)} required={requiresFull} />
      </label>

      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving || (requiresSst && requiresFull && !sstOk)}>
          {saving ? 'Salvando...' : actionLabel(action)}
        </button>
      </div>
    </form>
  );
}

function actionLabel(action) {
  const labels = {
    iniciar: 'Iniciar OS',
    pausar: 'Pausar OS',
    retomar: 'Retomar OS',
    concluir: 'Concluir OS'
  };
  return labels[action] || action;
}
