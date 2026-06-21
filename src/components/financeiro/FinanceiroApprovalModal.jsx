import { CONTRATO_STATUS, LANCAMENTO_STATUS, MEDICAO_STATUS, PREFEITURA_STATUS } from '../../services/financeiroService.js';

export default function FinanceiroApprovalModal({ form, entidadeTipo, saving, onChange, onSubmit, onCancel }) {
  const statusOptions = entidadeTipo === 'contrato' ? CONTRATO_STATUS : entidadeTipo === 'medicao' ? MEDICAO_STATUS : LANCAMENTO_STATUS;

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="field-label">
        Novo status
        <select className="form-control" value={form.status_novo || ''} required onChange={(event) => onChange('status_novo', event.target.value)}>
          <option value="">Selecione</option>
          {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
      </label>

      {entidadeTipo === 'medicao' && (
        <label className="field-label">
          Fiscalização Prefeitura
          <select className="form-control" value={form.prefeitura_status || ''} onChange={(event) => onChange('prefeitura_status', event.target.value)}>
            <option value="">Manter status atual</option>
            {PREFEITURA_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
      )}

      <label className="field-label">
        Parecer / motivo
        <textarea className="form-control min-h-28 py-3" value={form.motivo || ''} onChange={(event) => onChange('motivo', event.target.value)} />
      </label>

      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</button>
      </div>
    </form>
  );
}
