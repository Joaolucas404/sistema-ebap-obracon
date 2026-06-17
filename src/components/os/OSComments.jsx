import { Send } from 'lucide-react';
import { useState } from 'react';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

export default function OSComments({ comentarios = [], onSubmit, loading = false }) {
  const [comentario, setComentario] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!comentario.trim()) return;
    await onSubmit(comentario.trim());
    setComentario('');
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {comentarios.length ? (
          comentarios.map((item) => (
            <div key={item.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-white">{item.usuario?.nome || 'Usuário'}</strong>
                <small className="text-slate-400">{formatDate(item.created_at)}</small>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{item.comentario}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4 text-sm text-slate-300">
            Nenhum comentário registrado.
          </div>
        )}
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <textarea
          className="form-control min-h-28 py-3"
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          placeholder="Adicionar comentário..."
        />
        <button className="primary-button justify-self-start" type="submit" disabled={loading || !comentario.trim()}>
          <Send size={17} />
          Enviar comentário
        </button>
      </form>
    </div>
  );
}
