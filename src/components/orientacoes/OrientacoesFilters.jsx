import { Search } from 'lucide-react';
import { ORIENTACAO_CATEGORIAS, ORIENTACAO_STATUS, ORIENTACAO_TIPOS } from '../../services/orientacoesService.js';

export default function OrientacoesFilters({ filters, onChange, onReset }) {
  return (
    <section className="page-surface">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_170px_160px_auto]">
        <label className="field-label">
          Busca
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-100/70" size={18} />
            <input
              className="form-control pl-10"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Título, categoria ou conteúdo..."
            />
          </span>
        </label>

        <label className="field-label">
          Categoria
          <select className="form-control" value={filters.categoria} onChange={(event) => onChange({ categoria: event.target.value })}>
            <option value="">Todas</option>
            {ORIENTACAO_CATEGORIAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            <option value="">Todos</option>
            {ORIENTACAO_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <label className="field-label">
          Tipo
          <select className="form-control" value={filters.tipo} onChange={(event) => onChange({ tipo: event.target.value })}>
            <option value="">Todos</option>
            {ORIENTACAO_TIPOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <div className="flex items-end">
          <button className="secondary-button w-full" type="button" onClick={onReset}>
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
