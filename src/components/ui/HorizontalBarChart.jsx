const STATUS_COLORS = {
  execucao: '#3B82F6',
  supervisor: '#8B5CF6',
  cco: '#F59E0B',
  solicitada: '#94A3B8',
  concluida: '#2DD4BF',
  cancelada: '#EF4444',
  critica: '#DC2626',
  area: '#60A5FA',
  default: '#3B82F6'
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getChartToneColor(row, kind = 'status') {
  const source = normalizeText(`${row?.value || ''} ${row?.name || ''} ${row?.label || ''}`);

  if (source.includes('critica') || source.includes('nao conforme') || source.includes('rejeitada')) return STATUS_COLORS.critica;
  if (source.includes('cancelada')) return STATUS_COLORS.cancelada;
  if (source.includes('concluida') || source.includes('finalizada') || source.includes('validado')) return STATUS_COLORS.concluida;
  if (source.includes('supervisor')) return STATUS_COLORS.supervisor;
  if (source.includes('cco')) return STATUS_COLORS.cco;
  if (source.includes('solicitada') || source.includes('aberta') || source.includes('rascunho')) return STATUS_COLORS.solicitada;
  if (source.includes('execucao') || source.includes('encaminhada') || source.includes('tecnico') || source.includes('programada')) return STATUS_COLORS.execucao;
  if (kind === 'area') return STATUS_COLORS.area;
  return STATUS_COLORS.default;
}

export default function HorizontalBarChart({
  data = [],
  emptyText = 'Nenhum dado disponível.',
  getColor = getChartToneColor,
  maxItems = 15,
  valueFormatter = (value) => value
}) {
  const rows = data
    .filter((row) => Number(row?.total ?? row?.valueTotal ?? row?.value ?? 0) > 0)
    .slice(0, maxItems)
    .map((row) => ({
      ...row,
      label: row.label || row.name || row.value || 'Não informado',
      amount: Number(row.total ?? row.valueTotal ?? row.value ?? 0)
    }));

  const max = Math.max(...rows.map((row) => row.amount), 0);

  if (!rows.length) {
    return <div className="grid min-h-32 place-items-center rounded-xl bg-white/[0.04] px-4 text-center text-sm font-normal text-slate-300">{emptyText}</div>;
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => {
        const percentage = max > 0 ? Math.max(7, Math.round((row.amount / max) * 100)) : 0;
        const color = getColor(row);
        return (
          <div key={`${row.label}-${row.amount}`} className="grid gap-2" title={`${row.label}: ${valueFormatter(row.amount)}`}>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium leading-snug text-slate-100">{row.label}</span>
              <strong className="sig-number shrink-0 text-sm text-white">{valueFormatter(row.amount)}</strong>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#071A45]/85 ring-1 ring-blue-200/10">
              <div
                className="h-full rounded-full shadow-[0_0_18px_rgba(59,130,246,0.24)] transition-all duration-300"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { HorizontalBarChart };
