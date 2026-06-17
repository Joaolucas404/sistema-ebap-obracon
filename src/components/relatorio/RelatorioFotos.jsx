import { useState } from 'react';
import { ImagePlus } from 'lucide-react';

export default function RelatorioFotos({ fotos = [], data, onChange, onUpload, disabled = false }) {
  const [file, setFile] = useState(null);
  const [legenda, setLegenda] = useState('');

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;
    await onUpload(file, legenda);
    setFile(null);
    setLegenda('');
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Fotos</h3>
      <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleUpload}>
        <input className="form-control py-3" type="file" accept="image/*" disabled={disabled} onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <input className="form-control" value={legenda} disabled={disabled} onChange={(event) => setLegenda(event.target.value)} placeholder="Legenda da foto" />
        <button className="primary-button" type="submit" disabled={disabled || !file}>
          <ImagePlus size={17} />
          Enviar
        </button>
      </form>
      <label className="field-label mt-4">
        Observação sobre fotos
        <textarea className="form-control min-h-24 py-3" value={data?.observacao || ''} onChange={(event) => onChange({ ...data, observacao: event.target.value })} />
      </label>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fotos.length ? (
          fotos.map((foto) => (
            <div key={foto.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <strong className="block truncate text-white">{foto.nome_original}</strong>
              <small className="mt-1 block text-slate-400">{foto.legenda || 'Foto do relatório'}</small>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-5 text-sm text-slate-300">Nenhuma foto enviada.</div>
        )}
      </div>
    </section>
  );
}
