import { Search } from 'lucide-react';
import { OS_AREAS, OS_PRIORIDADES, OS_STATUS, STATUS_SUPERVISOR } from '../../services/supervisaoService.js';

export default function SupervisaoFilters({ filters, contexto, onChange, onReset }) {
  const canSeeAllAreas = contexto?.canSeeAllAreas;
  const areas = contexto?.areas?.length ? contexto.areas : OS_AREAS;

  function setField(field, value) {
    onChange({ [field]: value });
  }

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.3fr)_repeat(5,minmax(135px,1fr))]">
        <label className="field-label">
          Busca
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={17} />
            <input className="form-control pl-10" value={filters.search} onChange={(event) => setField('search', event.target.value)} placeholder="Número, título ou descrição" />
          </span>
        </label>

        {canSeeAllAreas && (
          <label className="field-label">
            Área
            <select className="form-control" value={filters.area} onChange={(event) => setField('area', event.target.value)}>
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.area || area.value} value={area.area || area.value}>{area.nome || area.label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="field-label">
          EBAP
          <select className="form-control" value={filters.ebapId} onChange={(event) => setField('ebapId', event.target.value)}>
            <option value="">Todas</option>
            {(contexto?.ebaps || []).map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </select>
        </label>

        <label className="field-label">
          Fila
          <select className="form-control" value={filters.statusSupervisor} onChange={(event) => setField('statusSupervisor', event.target.value)}>
            <option value="">Todas</option>
            {STATUS_SUPERVISOR.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>

        <label className="field-label">
          Status OS
          <select className="form-control" value={filters.status} onChange={(event) => setField('status', event.target.value)}>
            <option value="">Todos</option>
            {OS_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>

        <label className="field-label">
          Prioridade
          <select className="form-control" value={filters.prioridade} onChange={(event) => setField('prioridade', event.target.value)}>
            <option value="">Todas</option>
            {OS_PRIORIDADES.map((prioridade) => <option key={prioridade.value} value={prioridade.value}>{prioridade.label}</option>)}
          </select>
        </label>

        <label className="field-label">
          Técnico
          <select className="form-control" value={filters.tecnicoId} onChange={(event) => setField('tecnicoId', event.target.value)}>
            <option value="">Todos</option>
            {(contexto?.tecnicos || []).map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{tecnico.nome}</option>)}
          </select>
        </label>

        <label className="field-label">
          Equipe
          <input className="form-control" value={filters.equipe} onChange={(event) => setField('equipe', event.target.value)} placeholder="Equipe A" />
        </label>

        <label className="field-label">
          Data
          <input className="form-control" type="date" value={filters.data} onChange={(event) => setField('data', event.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="secondary-button" type="button" onClick={onReset}>Limpar filtros</button>
      </div>
    </section>
  );
}
