import { Search } from 'lucide-react';
import EbapStatusBadge from './EbapStatusBadge.jsx';
import { EBAP_STATUS } from '../../services/localizacaoEbapsService.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function EbapsSidePanel({ ebaps, filters, onFilterChange, onSelect }) {
  return (
    <aside className="glass-card rounded-3xl p-4">
      <div className="grid gap-3">
        <label className="field-label">
          Pesquisa
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={18} />
            <input
              className="form-control pl-10"
              value={filters.search}
              placeholder="Buscar EBAP..."
              onChange={(event) => onFilterChange({ search: event.target.value })}
            />
          </div>
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onFilterChange({ status: event.target.value })}>
            <option value="">Todos</option>
            {EBAP_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid max-h-[640px] gap-3 overflow-auto pr-1">
        {ebaps.map((ebap) => (
          <button
            key={ebap.id}
            className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4 text-left transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
            type="button"
            onClick={() => onSelect(ebap)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-white">{ebap.nome}</strong>
                <small className="text-slate-400">Atualizada: {formatDate(ebap.updated_at || ebap.created_at)}</small>
              </div>
              <EbapStatusBadge status={ebap.status_operacional} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
              <span className="rounded-xl bg-navy-950/60 p-2">OS: {ebap.os_abertas || 0}</span>
              <span className="rounded-xl bg-navy-950/60 p-2">RO: {ebap.ro_pendentes || 0}</span>
            </div>
          </button>
        ))}
        {!ebaps.length && <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/45 p-4 text-sm text-slate-300">Nenhuma EBAP encontrada.</div>}
      </div>
    </aside>
  );
}
