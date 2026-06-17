import { Search } from 'lucide-react';
import { CCO_REPORT_STATUS } from '../../services/ccoService.js';

export default function CcoFilters({ filters, ebaps = [], onChange }) {
  function setField(field, value) {
    onChange({ ...filters, [field]: value, page: 1 });
  }

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(145px,1fr))]">
        <label className="field-label">
          Pesquisa
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={17} />
            <input
              className="form-control pl-10"
              value={filters.search}
              onChange={(event) => setField('search', event.target.value)}
              placeholder="Codigo, ocorrencia, conclusao..."
            />
          </span>
        </label>

        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => setField('status', event.target.value)}>
            <option value="">Todos</option>
            {CCO_REPORT_STATUS.filter((item) => item.value !== 'rascunho').map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
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

        <label className="field-label">
          Inicio
          <input className="form-control" type="date" value={filters.dataInicio} onChange={(event) => setField('dataInicio', event.target.value)} />
        </label>

        <label className="field-label">
          Fim
          <input className="form-control" type="date" value={filters.dataFim} onChange={(event) => setField('dataFim', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
