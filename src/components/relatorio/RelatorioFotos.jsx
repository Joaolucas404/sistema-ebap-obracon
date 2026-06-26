import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus } from 'lucide-react';
import { FOTO_CATEGORIAS_OBRIGATORIAS } from '../../services/relatorioService.js';
import StatusBadge from '../ui/StatusBadge.jsx';

export default function RelatorioFotos({ fotos = [], data, onChange, onUpload, disabled = false, payload }) {
  const [previews, setPreviews] = useState({});
  const [uploading, setUploading] = useState('');

  const categorias = useMemo(() => {
    const base = [...FOTO_CATEGORIAS_OBRIGATORIAS];
    if (payload?.geradores?.possui === 'sim') {
      (payload.geradores.items || []).forEach((item, index) => {
        base.push({
          value: 'gerador_' + (index + 1),
          label: 'Foto do ' + (item.nome || ('Gerador ' + String(index + 1).padStart(2, '0'))),
          description: 'Foto individual do gerador informado.'
        });
      });
    }
    return base;
  }, [payload?.geradores]);

  const anexadas = new Set(fotos.map((foto) => foto.categoria));
  const faltantes = categorias.filter((item) => !anexadas.has(item.value));

  async function handleFile(categoria, file) {
    if (!file || disabled) return;
    const selected = categorias.find((item) => item.value === categoria);
    const previewUrl = URL.createObjectURL(file);
    setPreviews((current) => ({ ...current, [categoria]: previewUrl }));
    setUploading(categoria);
    try {
      await onUpload(file, selected?.label || '', categoria);
    } finally {
      setUploading('');
    }
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">Evidências Fotográficas</h3>
          <p className="mt-1 text-sm text-slate-300">Toque em cada card para registrar a evidência obrigatória do RDO.</p>
        </div>
        <StatusBadge tone={faltantes.length ? 'orange' : 'green'} size="md">
          {faltantes.length ? faltantes.length + ' pendente(s)' : 'Completo'}
        </StatusBadge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categorias.map((item) => {
          const added = anexadas.has(item.value) || Boolean(previews[item.value]);
          return (
            <article key={item.value} className={['rounded-3xl border p-4', added ? 'border-emerald-300/25 bg-emerald-400/10' : 'border-cyan-300/15 bg-navy-950/55'].join(' ')}>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-950/65">
                {previews[item.value] ? (
                  <img className="h-40 w-full object-cover" src={previews[item.value]} alt={item.label} />
                ) : (
                  <div className="grid h-40 place-items-center text-slate-400">
                    <Camera size={34} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <strong className="block text-white">{item.label}</strong>
                <small className="mt-1 block text-slate-300">{item.description}</small>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <PhotoInputButton id={item.value + '-camera'} label="Tirar foto" icon={Camera} capture disabled={disabled || uploading === item.value} onFile={(file) => handleFile(item.value, file)} />
                <PhotoInputButton id={item.value + '-gallery'} label="Galeria" icon={ImagePlus} disabled={disabled || uploading === item.value} onFile={(file) => handleFile(item.value, file)} />
              </div>
              <div className="mt-3 min-h-6">
                {uploading === item.value ? (
                  <span className="text-xs font-black uppercase tracking-wide text-cyan-100">Enviando...</span>
                ) : added ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-emerald-100"><CheckCircle2 size={14} /> Foto adicionada</span>
                ) : (
                  <span className="text-xs font-bold text-amber-100">Pendente</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <label className="field-label mt-4">
        Observação sobre fotos
        <textarea className="form-control min-h-24 py-3" value={data?.observacao || ''} onChange={(event) => onChange({ ...data, observacao: event.target.value })} />
      </label>
    </section>
  );
}

function PhotoInputButton({ id, label, icon: Icon, capture = false, disabled, onFile }) {
  return (
    <label className={['secondary-button cursor-pointer', disabled ? 'pointer-events-none opacity-60' : ''].join(' ')} htmlFor={id}>
      <Icon size={17} />
      {label}
      <input
        id={id}
        className="sr-only"
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          event.target.value = '';
          onFile(file);
        }}
      />
    </label>
  );
}
