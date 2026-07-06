import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { getChartToneColor } from './HorizontalBarChart.jsx';

export default function DonutChart({
  data = [],
  emptyText = 'Nenhum dado disponível.',
  maxItems = 6,
  valueFormatter = (value) => value
}) {
  const rows = data
    .filter((row) => Number(row?.total ?? 0) > 0)
    .slice(0, maxItems)
    .map((row) => ({
      ...row,
      name: row.name || row.label || row.value || 'Não informado',
      total: Number(row.total || 0)
    }));
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  if (!rows.length) {
    return <div className="grid min-h-32 place-items-center rounded-xl bg-white/[0.04] px-4 text-center text-sm font-normal text-slate-300">{emptyText}</div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="relative h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="total" nameKey="name" innerRadius={70} outerRadius={96} paddingAngle={5}>
              {rows.map((row) => <Cell key={row.name} fill={getChartToneColor(row)} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#0A1633', border: '1px solid rgba(147,197,253,.25)', borderRadius: 14, color: '#fff' }}
              formatter={(value) => [valueFormatter(value), 'Total']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span>
            <strong className="sig-number block text-3xl text-white">{valueFormatter(total)}</strong>
            <small className="text-[13px] font-normal uppercase tracking-[0.08em] text-slate-400">Total</small>
          </span>
        </div>
      </div>
      <div className="grid content-center gap-3">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-normal leading-snug text-slate-100">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getChartToneColor(row) }} />
              {row.name}
            </span>
            <strong className="sig-number shrink-0 text-sm text-white">{valueFormatter(row.total)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DonutChart };
