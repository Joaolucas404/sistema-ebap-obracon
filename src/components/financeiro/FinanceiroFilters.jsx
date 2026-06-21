import { Search } from 'lucide-react';
import { CONTRATO_STATUS, LANCAMENTO_STATUS, LANCAMENTO_TIPOS, MEDICAO_STATUS, PREFEITURA_STATUS } from '../../services/financeiroService.js';

export default function FinanceiroFilters({ filters, fornecedores, ebaps, contratos, activeTab, onChange, onReset }) {
  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <label className="field-label lg:col-span-2">
          Pesquisa
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100" size={18} />
            <input className="form-control pl-11" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="Número, objeto, observações..." />
          </div>
        </label>

        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            <option value="">Todos</option>
            {(activeTab === 'medicoes' ? MEDICAO_STATUS : activeTab === 'lancamentos' ? LANCAMENTO_STATUS : CONTRATO_STATUS).map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>

        {activeTab === 'medicoes' && (
          <label className="field-label">
            Prefeitura
            <select className="form-control" value={filters.prefeituraStatus} onChange={(event) => onChange({ prefeituraStatus: event.target.value })}>
              <option value="">Todos</option>
              {PREFEITURA_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
        )}

        {activeTab === 'lancamentos' && (
          <label className="field-label">
            Tipo
            <select className="form-control" value={filters.tipo} onChange={(event) => onChange({ tipo: event.target.value })}>
              <option value="">Todos</option>
              {LANCAMENTO_TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
            </select>
          </label>
        )}

        {activeTab === 'contratos' && (
          <label className="field-label">
            Fornecedor
            <select className="form-control" value={filters.fornecedorId} onChange={(event) => onChange({ fornecedorId: event.target.value })}>
              <option value="">Todos</option>
              {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}
            </select>
          </label>
        )}

        {(activeTab === 'medicoes' || activeTab === 'lancamentos') && (
          <label className="field-label">
            Contrato
            <select className="form-control" value={filters.contratoId} onChange={(event) => onChange({ contratoId: event.target.value })}>
              <option value="">Todos</option>
              {contratos.map((contrato) => <option key={contrato.id} value={contrato.id}>{contrato.numero}</option>)}
            </select>
          </label>
        )}

        <label className="field-label">
          EBAP
          <select className="form-control" value={filters.ebapId} onChange={(event) => onChange({ ebapId: event.target.value })}>
            <option value="">Todas</option>
            {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="secondary-button" type="button" onClick={onReset}>Limpar filtros</button>
      </div>
    </section>
  );
}
