import { X } from 'lucide-react';
import { NOTIFICACAO_MODULOS, NOTIFICACAO_PRIORIDADES, NOTIFICACAO_TIPOS } from '../../services/notificacoesService.js';

export default function NotificationsFilters({ filters, onChange, onReset }) {
  return (
    <section className="glass-card rounded-3xl p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <label className="field-label">
          Modulo
          <select className="form-control" value={filters.modulo} onChange={(event) => onChange({ modulo: event.target.value })}>
            <option value="">Todos</option>
            {NOTIFICACAO_MODULOS.map((modulo) => <option key={modulo.value} value={modulo.value}>{modulo.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Prioridade
          <select className="form-control" value={filters.prioridade} onChange={(event) => onChange({ prioridade: event.target.value })}>
            <option value="">Todas</option>
            {NOTIFICACAO_PRIORIDADES.map((prioridade) => <option key={prioridade.value} value={prioridade.value}>{prioridade.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Tipo
          <select className="form-control" value={filters.tipo} onChange={(event) => onChange({ tipo: event.target.value })}>
            <option value="">Todos</option>
            {NOTIFICACAO_TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          Status
          <select className="form-control" value={filters.status} onChange={(event) => onChange({ status: event.target.value })}>
            <option value="">Todas</option>
            <option value="nao_lidas">Nao lidas</option>
            <option value="lidas">Lidas</option>
          </select>
        </label>
        <label className="field-label">
          Inicio
          <input className="form-control" type="date" value={filters.dataInicio} onChange={(event) => onChange({ dataInicio: event.target.value })} />
        </label>
        <label className="field-label">
          Fim
          <input className="form-control" type="date" value={filters.dataFim} onChange={(event) => onChange({ dataFim: event.target.value })} />
        </label>
        <button className="secondary-button self-end" type="button" onClick={onReset}>
          <X size={17} />
          Limpar
        </button>
      </div>
    </section>
  );
}
