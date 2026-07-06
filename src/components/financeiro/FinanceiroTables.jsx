import { CheckCircle2, Eye, FileUp, Pencil, Trash2 } from 'lucide-react';
import FinanceiroStatusBadge from './FinanceiroStatusBadge.jsx';

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function date(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-';
}

export function ContratosTable({ contratos, loading, canManage, canApprove, onEdit, onApprove, onDelete, onUpload, onView }) {
  if (loading) return <Empty label="Carregando contratos..." />;
  if (!contratos.length) return <Empty label="Nenhum contrato encontrado." />;

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <TableHeader columns={['Contrato', 'Fornecedor', 'Vigência', 'Valor', 'Status', 'Ações']} />
      <div className="divide-y divide-cyan-300/10">
        {contratos.map((contrato) => (
          <div key={contrato.id} className="grid gap-3 p-4 text-sm text-slate-200 lg:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_1.4fr] lg:items-center">
            <Cell title="Contrato">
              <strong className="block text-base text-white">{contrato.numero}</strong>
              <span>{contrato.objeto}</span>
              {contrato.ebap?.nome && <small className="block text-cyan-100">{contrato.ebap.nome}</small>}
            </Cell>
            <Cell title="Fornecedor">{contrato.fornecedor?.nome || '-'}</Cell>
            <Cell title="Vigência">{date(contrato.data_inicio)} até {date(contrato.data_fim)}</Cell>
            <Cell title="Valor">
              <strong className="text-white">{money(contrato.valor_total)}</strong>
              <small className="block text-slate-400">Executado {money(contrato.valor_executado)}</small>
            </Cell>
            <Cell title="Status"><FinanceiroStatusBadge status={contrato.status} /></Cell>
            <Actions>
              <IconButton icon={Eye} label="Detalhes" onClick={() => onView('contrato', contrato)} />
              <IconButton icon={FileUp} label="Documento" onClick={() => onUpload('contrato', contrato)} />
              {canApprove && <IconButton icon={CheckCircle2} label="Aprovar" onClick={() => onApprove('contrato', contrato)} />}
              {canManage && <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(contrato)} />}
              {canManage && <IconButton icon={Trash2} label="Excluir" onClick={() => onDelete('contrato', contrato)} danger />}
            </Actions>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MediçõesTable({ medições, loading, canManage, canApprove, onEdit, onApprove, onDelete, onUpload, onView }) {
  if (loading) return <Empty label="Carregando medições..." />;
  if (!medições.length) return <Empty label="Nenhuma medição encontrada." />;

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <TableHeader columns={['Medição', 'Contrato', 'Competência', 'Valores', 'Fiscalização', 'Ações']} />
      <div className="divide-y divide-cyan-300/10">
        {medições.map((medicao) => (
          <div key={medicao.id} className="grid gap-3 p-4 text-sm text-slate-200 lg:grid-cols-[1fr_1fr_0.8fr_1fr_1fr_1.4fr] lg:items-center">
            <Cell title="Medição">
              <strong className="block text-base text-white">{medicao.numero || medicao.codigo}</strong>
              <span>{medicao.resumo || '-'}</span>
              <FinanceiroStatusBadge status={medicao.status} />
            </Cell>
            <Cell title="Contrato">{medicao.contrato?.numero || '-'}</Cell>
            <Cell title="Competência">{String(medicao.competencia_mes).padStart(2, '0')}/{medicao.competencia_ano}</Cell>
            <Cell title="Valores">
              <strong className="text-white">{money(medicao.valor_medido)}</strong>
              <small className="block text-slate-400">Aprovado {money(medicao.valor_aprovado)}</small>
              <small className="block text-red-100">Glosa {money(medicao.valor_glosa)}</small>
            </Cell>
            <Cell title="Fiscalização"><FinanceiroStatusBadge status={medicao.prefeitura_status} /></Cell>
            <Actions>
              <IconButton icon={Eye} label="Detalhes" onClick={() => onView('medicao', medicao)} />
              <IconButton icon={FileUp} label="Documento" onClick={() => onUpload('medicao', medicao)} />
              {canApprove && <IconButton icon={CheckCircle2} label="Aprovar" onClick={() => onApprove('medicao', medicao)} />}
              {canManage && <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(medicao)} />}
              {canManage && <IconButton icon={Trash2} label="Excluir" onClick={() => onDelete('medicao', medicao)} danger />}
            </Actions>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LancamentosTable({ lancamentos, loading, canManage, canApprove, onEdit, onApprove, onDelete, onUpload, onView }) {
  if (loading) return <Empty label="Carregando lançamentos..." />;
  if (!lancamentos.length) return <Empty label="Nenhum lançamento financeiro encontrado." />;

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <TableHeader columns={['Lançamento', 'Vínculo', 'Valor', 'Vencimento', 'Status', 'Ações']} />
      <div className="divide-y divide-cyan-300/10">
        {lancamentos.map((lancamento) => (
          <div key={lancamento.id} className="grid gap-3 p-4 text-sm text-slate-200 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr_1.4fr] lg:items-center">
            <Cell title="Lançamento">
              <strong className="block text-base text-white">{lancamento.descricao}</strong>
              <span>{lancamento.tipo} {lancamento.categoria ? `- ${lancamento.categoria}` : ''}</span>
            </Cell>
            <Cell title="Vínculo">
              <span>{lancamento.contrato?.numero || lancamento.medicao?.codigo || lancamento.fornecedor?.nome || '-'}</span>
              {lancamento.ebap?.nome && <small className="block text-cyan-100">{lancamento.ebap.nome}</small>}
            </Cell>
            <Cell title="Valor"><strong className="text-white">{money(lancamento.valor)}</strong></Cell>
            <Cell title="Vencimento">{date(lancamento.vencimento)}</Cell>
            <Cell title="Status"><FinanceiroStatusBadge status={lancamento.status} /></Cell>
            <Actions>
              <IconButton icon={Eye} label="Detalhes" onClick={() => onView('lancamento', lancamento)} />
              <IconButton icon={FileUp} label="Documento" onClick={() => onUpload('lancamento', lancamento)} />
              {canApprove && <IconButton icon={CheckCircle2} label="Aprovar" onClick={() => onApprove('lancamento', lancamento)} />}
              {canManage && <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(lancamento)} />}
              {canManage && <IconButton icon={Trash2} label="Excluir" onClick={() => onDelete('lancamento', lancamento)} danger />}
            </Actions>
          </div>
        ))}
      </div>
    </section>
  );
}

function TableHeader({ columns }) {
  return (
    <div className="hidden grid-cols-[var(--cols)] gap-3 border-b border-cyan-300/15 bg-navy-950/40 px-4 py-3 text-xs font-black uppercase text-slate-400 lg:grid" style={{ '--cols': columns.map(() => '1fr').join(' ') }}>
      {columns.map((column) => <span key={column}>{column}</span>)}
    </div>
  );
}

function Cell({ title, children }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-black uppercase text-slate-500 lg:hidden">{title}</span>
      {children}
    </div>
  );
}

function Actions({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function IconButton({ icon: Icon, label, onClick, danger }) {
  return (
    <button type="button" className={danger ? 'secondary-button min-h-10 border-red-300/30 text-red-100' : 'secondary-button min-h-10'} onClick={onClick} title={label}>
      <Icon size={16} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Empty({ label }) {
  return <div className="glass-card rounded-3xl p-8 text-center text-sm font-bold text-slate-300">{label}</div>;
}
