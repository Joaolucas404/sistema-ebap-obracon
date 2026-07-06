import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buscarGlobal } from '../../services/globalSearchService.js';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (term.trim().length < 2) {
        setGroups([]);
        return;
      }
      setLoading(true);
      const result = await buscarGlobal(term);
      setGroups(result);
      setLoading(false);
      setOpen(true);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    function onClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  function go(path) {
    setOpen(false);
    setTerm('');
    navigate(path);
  }

  return (
    <div ref={ref} className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-100" size={18} />
      <input
        className="form-control h-11 border-blue-200/20 bg-navy-950/60 pl-11 pr-10 text-sm shadow-inner"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Pesquisar OS, EBAP, usuário, equipamento, plano ou compra"
      />
      {term && (
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white" onClick={() => setTerm('')}>
          <X size={16} />
        </button>
      )}
      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 max-h-[70vh] overflow-auto rounded-2xl border border-blue-200/20 bg-[#08245a] p-3 shadow-2xl shadow-black/40 animate-softIn">
          {loading && <p className="p-3 text-sm font-bold text-slate-300">Buscando...</p>}
          {!loading && !groups.length && <p className="p-3 text-sm font-bold text-slate-300">Nenhum resultado encontrado.</p>}
          {!loading && groups.map((group) => (
            <section key={group.label} className="mb-3 last:mb-0">
              <h4 className="px-2 pb-2 text-xs font-black uppercase tracking-[0.12em] text-blue-100">{group.label}</h4>
              <div className="grid gap-1">
                {group.items.map((item) => (
                  <button key={`${group.label}-${item.id}`} type="button" className="rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-blue-200/20 hover:bg-white/10" onClick={() => go(item.path)}>
                    <strong className="block text-sm text-white">{item.title}</strong>
                    <span className="block text-xs text-slate-300">{item.description}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
