export default function DataTable({ columns = [], rows = [], empty = 'Nenhum registro encontrado.' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200/12 bg-[#071A45]/45">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="border-b border-blue-200/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-black">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-200/8">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="transition hover:bg-blue-500/8">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm font-semibold text-slate-100">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="p-6 text-center text-sm font-bold text-slate-300">{empty}</div>}
    </div>
  );
}

export { DataTable as DSDataTable };
