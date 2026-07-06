import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';

const ACTIONS = {
  aprovar: { title: 'Aprovar relatorio', button: 'Aprovar', tone: 'primary-button', requiresReason: false },
  rejeitar: { title: 'Rejeitar relatorio', button: 'Rejeitar', tone: 'danger-button', requiresReason: true },
  correcao: { title: 'Solicitar correcao', button: 'Solicitar correcao', tone: 'secondary-button', requiresReason: true }
};

export default function CcoValidationModal({ open, action, report, loading = false, onClose, onSubmit }) {
  const config = ACTIONS[action] || ACTIONS.aprovar;
  const [form, setForm] = useState({
    comunicacao_status: '',
    protocolo: '',
    motivo: '',
    observacoes: '',
    assinatura_digital: ''
  });

  const canSubmit = useMemo(() => !config.requiresReason || form.motivo.trim().length >= 5, [config.requiresReason, form.motivo]);

  useEffect(() => {
    if (!open) return;
    setForm({
      comunicacao_status: '',
      protocolo: '',
      motivo: '',
      observacoes: '',
      assinatura_digital: ''
    });
  }, [open, action, report?.id]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal
      open={open}
      title={config.title}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="secondary-button" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className={config.tone} type="button" onClick={() => onSubmit(form)} disabled={loading || !canSubmit}>
            {loading ? 'Processando...' : config.button}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
          <strong className="text-white">{report?.codigo || '-'}</strong>
          <p className="mt-1 text-sm text-slate-300">{report?.ebap?.nome || 'EBAP'} | {report?.operador?.nome || 'Operador'}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="field-label">
            Comunicacao CCO
            <input className="form-control" value={form.comunicacao_status} onChange={(event) => setField('comunicacao_status', event.target.value)} placeholder="Ex.: contato confirmado" />
          </label>
          <label className="field-label">
            Protocolo
            <input className="form-control" value={form.protocolo} onChange={(event) => setField('protocolo', event.target.value)} placeholder="Protocolo interno" />
          </label>
        </div>

        {config.requiresReason && (
          <label className="field-label">
            Motivo obrigatorio
            <textarea className="form-control min-h-28" value={form.motivo} onChange={(event) => setField('motivo', event.target.value)} placeholder="Descreva o motivo da rejeicao ou correcao solicitada." />
          </label>
        )}

        <label className="field-label">
          Observacoes
          <textarea className="form-control min-h-24" value={form.observacoes} onChange={(event) => setField('observacoes', event.target.value)} placeholder="Observações da validação CCO." />
        </label>

        <label className="field-label">
          Assinatura digital
          <input className="form-control" value={form.assinatura_digital} onChange={(event) => setField('assinatura_digital', event.target.value)} placeholder="Nome ou matricula do validador" />
        </label>
      </div>
    </Modal>
  );
}
