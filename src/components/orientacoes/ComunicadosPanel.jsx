import { Megaphone } from 'lucide-react';
import { ORIENTACAO_CATEGORIAS } from '../../services/orientacoesService.js';

function categoriaLabel(value) {
  return ORIENTACAO_CATEGORIAS.find((item) => item.value === value)?.label || value;
}

export default function ComunicadosPanel({ comunicados, onSelect }) {
  return (
    <section className="page-surface">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-orange-400/15 text-orange-100">
          <Megaphone size={22} />
        </span>
        <div>
          <h3 className="text-xl font-black text-white">Comunicados operacionais</h3>
          <p className="text-sm text-slate-300">Avisos, mudanças de processo e alertas ativos para a operação.</p>
        </div>
      </div>

      {!comunicados?.length ? (
        <div className="rounded-2xl border border-white/10 bg-navy-950/45 p-4 text-sm font-bold text-slate-300">
          Nenhum comunicado operacional publicado.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {comunicados.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rounded-2xl border border-orange-300/20 bg-orange-400/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-200/40"
              onClick={() => onSelect(item)}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-orange-300/15 px-3 py-1 text-[11px] font-black uppercase text-orange-100">{categoriaLabel(item.categoria)}</span>
                <span className="text-xs font-bold text-slate-300">v{item.versao}</span>
              </div>
              <h4 className="line-clamp-2 text-base font-black text-white">{item.titulo}</h4>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{item.descricao}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
