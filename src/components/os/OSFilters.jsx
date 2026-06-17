import { Search } from 'lucide-react';
import { OS_PRIORIDADES, OS_STATUS } from '../../services/osService.js';

export default function OSFilters({ filters, onChange, ebaps = [], responsaveis = [], showResponsavel = true }) {
  function setField(field, value) {
    onChange({ ...filters, [field]: value, page: 1 });
  }

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(150px,1fr))]">
        <label className="field-label">
          Pesquisa
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={17} />
            <input
              className="form-control pl-10"
              value={filters.search}
              onChange={(event) => setField('search', event.target.value)}
              placeholder="Número, título, descrição..."
            />
          </span>
        </label>

        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => setField('status', event.target.value)}>
            <option value="">Todos</option>
            {OS_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Prioridade
          <select className="form-control" value={filters.prioridade} onChange={(event) => setField('prioridade', event.target.value)}>
            <option value="">Todas</option>
            {OS_PRIORIDADES.map((prioridade) => (
              <option key={prioridade.value} value={prioridade.value}>
                {prioridade.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          EBAP
          <select className="form-control" value={filters.ebapId} onChange={(event) => setField('ebapId', event.target.value)}>
            <option value="">Todas</option>
            {ebaps.map((ebap) => (
              <option key={ebap.id} value={ebap.id}>
                {ebap.nome}
              </option>
            ))}
          </select>
        </label>

        {showResponsavel && (
          <label className="field-label">
            Responsável
            <select className="form-control" value={filters.responsavelId} onChange={(event) => setField('responsavelId', event.target.value)}>
              <option value="">Todos</option>
              {responsaveis.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
