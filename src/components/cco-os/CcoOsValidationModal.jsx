export default function CcoOsValidationModal({ os, action, motivo, saving, onMotivoChange, onConfirm, onCancel }) {
  if (!os || !action) return null;

  const labels = {
    aprovar: {
      title: 'Aprovar OS',
      description: 'A OS sera encaminhada ao Supervisor/Manutencao com roteamento por area.',
      button: 'Aprovar'
    },
    rejeitar: {
      title: 'Rejeitar OS',
      description: 'A OS sera rejeitada e o solicitante sera notificado.',
      button: 'Rejeitar'
    },
    corrigir: {
      title: 'Solicitar correcao',
      description: 'A OS voltara ao solicitante para ajustes.',
      button: 'Solicitar correcao'
    }
  };

  const config = labels[action];
  const requiresMotivo = action !== 'aprovar';

  return (
    <form className="grid gap-4" onSubmit={onConfirm}>
      <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h3 className="text-xl font-black text-white">{config.title}</h3>
        <p className="mt-1 text-sm text-slate-300">{config.description}</p>
        <strong className="mt-3 block text-white">{os.numero} - {os.titulo}</strong>
      </div>

      <label className="field-label">
        Motivo {requiresMotivo ? '(obrigatorio)' : '/ observacao'}
        <textarea
          className="form-control min-h-28 py-3"
          value={motivo}
          onChange={(event) => onMotivoChange(event.target.value)}
          required={requiresMotivo}
          minLength={requiresMotivo ? 5 : undefined}
        />
      </label>

      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className={action === 'rejeitar' ? 'danger-button' : 'primary-button'} type="submit" disabled={saving}>
          {saving ? 'Salvando...' : config.button}
        </button>
      </div>
    </form>
  );
}
