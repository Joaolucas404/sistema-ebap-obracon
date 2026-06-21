export default function FinanceiroUploadModal({ file, saving, onFile, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm text-slate-300">
        O documento será salvo no bucket privado <strong className="text-white">contract-files</strong> e vinculado ao registro financeiro selecionado.
      </div>
      <label className="field-label">
        Arquivo
        <input className="form-control py-3" type="file" required onChange={(event) => onFile(event.target.files?.[0] || null)} />
      </label>
      {file && <p className="text-sm font-bold text-cyan-100">{file.name}</p>}
      <div className="flex justify-end gap-2">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Enviar documento'}</button>
      </div>
    </form>
  );
}
