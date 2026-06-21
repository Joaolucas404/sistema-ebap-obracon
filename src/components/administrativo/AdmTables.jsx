import { Download, FileUp, Pencil, Trash2 } from 'lucide-react';

function date(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-';
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function GenericTable({ rows, columns, empty, actions }) {
  if (!rows.length) return <div className="glass-card rounded-3xl p-8 text-center text-sm font-bold text-slate-300">{empty}</div>;
  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="hidden border-b border-cyan-300/15 bg-navy-950/40 px-4 py-3 text-xs font-black uppercase text-slate-400 lg:grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr)) 150px` }}>
        {columns.map((column) => <span key={column.key}>{column.label}</span>)}
        <span>Ações</span>
      </div>
      <div className="divide-y divide-cyan-300/10">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-3 p-4 text-sm text-slate-200 lg:items-center" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr)) 150px` }}>
            {columns.map((column) => (
              <div key={column.key}>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500 lg:hidden">{column.label}</span>
                {column.render ? column.render(row) : row[column.key] || '-'}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">{actions(row)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActionButtons({ onEdit, onUpload, onOpen, onDelete }) {
  return (
    <>
      {onOpen && <IconButton icon={Download} label="Abrir" onClick={onOpen} />}
      {onUpload && <IconButton icon={FileUp} label="Documento" onClick={onUpload} />}
      {onEdit && <IconButton icon={Pencil} label="Editar" onClick={onEdit} />}
      {onDelete && <IconButton icon={Trash2} label="Excluir" danger onClick={onDelete} />}
    </>
  );
}

function IconButton({ icon: Icon, label, onClick, danger }) {
  return <button type="button" title={label} className={danger ? 'secondary-button min-h-10 border-red-300/30 text-red-100' : 'secondary-button min-h-10'} onClick={onClick}><Icon size={16} /><span className="sr-only">{label}</span></button>;
}

export const admFormat = { date, money };
