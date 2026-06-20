import { RotateCcw, Search } from 'lucide-react';

export default function AlmoxFilters({ filters, categorias, locais, onChange, onReset }) {
  function update(field, value) {
    onChange({ [field]: value, page: 1 });
  }

  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
        <label className="field-label">
          Pesquisa
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200" size={18} />
            <input
              className="form-control pl-10"
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Codigo, item ou categoria..."
            />
          </span>
        </label>

        <label className="field-label">
          Categoria
          <select className="form-control" value={filters.categoria} onChange={(event) => update('categoria', event.target.value)}>
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Local
          <select className="form-control" value={filters.localId} onChange={(event) => update('localId', event.target.value)}>
            <option value="">Todos</option>
            {locais.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => update('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </label>

        <label className="field-label">
          Estoque
          <select className="form-control" value={filters.estoque} onChange={(event) => update('estoque', event.target.value)}>
            <option value="">Todos</option>
            <option value="baixo">Minimo</option>
            <option value="zerado">Zerado</option>
          </select>
        </label>

        <div className="flex items-end">
          <button className="secondary-button w-full" type="button" onClick={onReset}>
            <RotateCcw size={17} />
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
