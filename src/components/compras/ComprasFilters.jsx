import { Search, X } from 'lucide-react';
import { COMPRA_AREAS, COMPRA_STATUS } from '../../services/comprasService.js';

export default function ComprasFilters({ filters, ebaps, onChange, onReset }) {
  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto]">
        <label className="field-label">
          Pesquisa
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={18} />
            <input
              className="form-control pl-10"
              value={filters.search}
              placeholder="Numero, justificativa, area..."
              onChange={(event) => onChange({ search: event.target.value })}
            />
          </div>
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            <option value="">Todos</option>
            {COMPRA_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Area
          <select className="form-control" value={filters.area} onChange={(event) => onChange({ area: event.target.value })}>
            <option value="">Todas</option>
            {COMPRA_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          EBAP
          <select className="form-control" value={filters.ebapId} onChange={(event) => onChange({ ebapId: event.target.value })}>
            <option value="">Todas</option>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </select>
        </label>
        <button className="secondary-button self-end" type="button" onClick={onReset}>
          <X size={17} />
          Limpar
        </button>
      </div>
    </section>
  );
}
