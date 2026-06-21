import { OS_AREAS, OS_DIARIA_PERIODOS, OS_DIARIA_TURNOS } from '../../services/osDiariaService.js';

export default function OsDiariaFilters({ filters, onChange }) {
  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="field-label">
          Periodo
          <select className="form-control" value={filters.periodo} onChange={(event) => onChange({ periodo: event.target.value })}>
            {OS_DIARIA_PERIODOS.map((periodo) => <option key={periodo.value} value={periodo.value}>{periodo.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Turno
          <select className="form-control" value={filters.turno} onChange={(event) => onChange({ turno: event.target.value })}>
            <option value="">Todos</option>
            {OS_DIARIA_TURNOS.map((turno) => <option key={turno.value} value={turno.value}>{turno.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Area
          <select className="form-control" value={filters.area} onChange={(event) => onChange({ area: event.target.value })}>
            <option value="">Todas</option>
            {OS_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}
