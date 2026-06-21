import { X } from 'lucide-react';
import { CCO_OS_ORIGENS, CCO_OS_STATUS, OS_AREAS, OS_PRIORIDADES } from '../../services/ccoOsService.js';

export default function CcoOsFilters({ filters, ebaps, onChange, onReset }) {
  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <label className="field-label">
          EBAP
          <select className="form-control" value={filters.ebapId} onChange={(event) => onChange({ ebapId: event.target.value })}>
            <option value="">Todas</option>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </select>
        </label>
        <label className="field-label">
          Area
          <select className="form-control" value={filters.area} onChange={(event) => onChange({ area: event.target.value })}>
            <option value="">Todas</option>
            {OS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Prioridade
          <select className="form-control" value={filters.prioridade} onChange={(event) => onChange({ prioridade: event.target.value })}>
            <option value="">Todas</option>
            {OS_PRIORIDADES.map((prioridade) => <option key={prioridade.value} value={prioridade.value}>{prioridade.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Origem
          <select className="form-control" value={filters.origem} onChange={(event) => onChange({ origem: event.target.value })}>
            <option value="">Todas</option>
            {CCO_OS_ORIGENS.map((origem) => <option key={origem.value} value={origem.value}>{origem.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            <option value="">Todos</option>
            {CCO_OS_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Data
          <input className="form-control" type="date" value={filters.data} onChange={(event) => onChange({ data: event.target.value })} />
        </label>
        <button className="secondary-button self-end" type="button" onClick={onReset}>
          <X size={17} />
          Limpar
        </button>
      </div>
    </section>
  );
}
