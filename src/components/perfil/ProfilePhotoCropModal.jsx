import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Minus, Plus, Save, X } from 'lucide-react';

export default function ProfilePhotoCropModal({ file, open, saving = false, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1.12);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState('');

  const sourceUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    if (!sourceUrl) return undefined;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setZoom(1.12);
      setOffsetX(0);
      setOffsetY(0);
      setError('');
    };
    img.onerror = () => setError('Não foi possível abrir esta imagem.');
    img.src = sourceUrl;

    return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  useEffect(() => {
    if (!open || !image) return;
    drawPreview();
  }, [open, image, zoom, offsetX, offsetY]);

  if (!open || !file) return null;

  function drawPreview(targetCanvas = canvasRef.current, size = 360) {
    if (!image || !targetCanvas) return;
    const canvas = targetCanvas;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const baseScale = Math.max(size / image.width, size / image.height);
    const scale = baseScale * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const maxX = Math.max(0, (drawWidth - size) / 2);
    const maxY = Math.max(0, (drawHeight - size) / 2);
    const x = (size - drawWidth) / 2 + (offsetX / 100) * maxX;
    const y = (size - drawHeight) / 2 + (offsetY / 100) * maxY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    ctx.restore();

    ctx.strokeStyle = 'rgba(214,228,255,.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  async function handleConfirm() {
    if (!image) return;
    const canvas = document.createElement('canvas');
    drawPreview(canvas, 512);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) {
      setError('Não foi possível gerar a foto recortada.');
      return;
    }
    const croppedFile = new File([blob], `perfil-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onConfirm?.(croppedFile);
  }

  const modal = (
    <div className="fixed inset-0 z-[2147483647] grid items-start justify-items-center overflow-y-auto bg-[#0A1633]/82 p-3 pt-6 backdrop-blur-sm">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-blue-200/20 bg-[#10224D] shadow-2xl shadow-black/40">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-200/10 bg-[#10224D] px-4 py-3">
          <div>
            <h3 className="text-base font-black text-white">Ajustar foto</h3>
            <p className="text-xs font-semibold text-slate-300">Centralize o rosto antes de salvar.</p>
          </div>
          <button className="secondary-button min-h-9 px-3" type="button" onClick={onCancel} disabled={saving}>
            <X size={17} />
          </button>
        </header>

        <div className="grid max-h-[calc(100dvh-180px)] gap-4 overflow-y-auto p-4">
          <div className="mx-auto grid size-[220px] place-items-center overflow-hidden rounded-full border border-blue-200/15 bg-[#0A1633]/70 sm:size-[260px]">
            {image ? <canvas ref={canvasRef} className="size-full" /> : <ImageIcon className="text-blue-100" size={42} />}
          </div>

          <div className="grid gap-3">
            <RangeControl icon={Minus} label="Zoom" value={zoom} min={1} max={2.4} step={0.02} onChange={(value) => setZoom(Number(value))} rightIcon={Plus} />
            <RangeControl label="Horizontal" value={offsetX} min={-100} max={100} step={1} onChange={(value) => setOffsetX(Number(value))} />
            <RangeControl label="Vertical" value={offsetY} min={-100} max={100} step={1} onChange={(value) => setOffsetY(Number(value))} />
          </div>

          {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{error}</div>}
        </div>

        <footer className="grid gap-2 border-t border-blue-200/10 bg-[#10224D] p-4 sm:grid-cols-2">
          <button className="secondary-button justify-center" type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button className="primary-button justify-center" type="button" onClick={handleConfirm} disabled={saving || !image}>
            <Save size={17} />
            {saving ? 'Salvando...' : 'Salvar foto'}
          </button>
        </footer>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}

function RangeControl({ icon: Icon, rightIcon: RightIcon, label, value, min, max, step, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-100">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs font-bold text-slate-400">{Number(value).toFixed(label === 'Zoom' ? 2 : 0)}</span>
      </span>
      <span className="grid grid-cols-[24px_minmax(0,1fr)_24px] items-center gap-2">
        <span className="grid place-items-center text-blue-100">{Icon ? <Icon size={16} /> : null}</span>
        <input className="w-full accent-blue-500" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
        <span className="grid place-items-center text-blue-100">{RightIcon ? <RightIcon size={16} /> : null}</span>
      </span>
    </label>
  );
}
