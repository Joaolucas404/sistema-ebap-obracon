const TIPO_LABEL = {
  entrada: 'Entrada',
  saida: 'Saida',
  ajuste: 'Ajuste',
  emprestimo: 'Emprestimo',
  devolucao: 'Devolucao',
  transferencia: 'Transferencia'
};

const TIPO_TONE = {
  entrada: 'border-green-300/30 bg-green-500/15 text-green-100',
  devolucao: 'border-green-300/30 bg-green-500/15 text-green-100',
  saida: 'border-orange-300/30 bg-orange-500/15 text-orange-100',
  emprestimo: 'border-orange-300/30 bg-orange-500/15 text-orange-100',
  transferencia: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100',
  ajuste: 'border-blue-300/30 bg-blue-500/15 text-blue-100'
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('pt-BR');
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value || 0));
}

export default function AlmoxMovementHistory({ movimentacoes }) {
  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">Historico de movimentacoes</h3>
          <p className="text-sm text-slate-300">Ultimas entradas, saidas, ajustes e transferencias registradas.</p>
        </div>
      </div>

      {movimentacoes.length ? (
        <div className="grid gap-3">
          {movimentacoes.map((mov) => (
            <article key={mov.id} className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${TIPO_TONE[mov.tipo] || TIPO_TONE.ajuste}`}>
                      {TIPO_LABEL[mov.tipo] || mov.tipo}
                    </span>
                    <strong className="text-white">{mov.item?.nome || 'Item'}</strong>
                    <span className="text-xs font-bold text-cyan-100">{mov.item?.codigo}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Quantidade: <strong className="text-white">{formatNumber(mov.quantidade)} {mov.item?.unidade}</strong>
                    {' '}| Saldo: {formatNumber(mov.saldo_anterior)} para {formatNumber(mov.saldo_posterior)}
                  </p>
                  {(mov.origem || mov.destino || mov.observacao) && (
                    <p className="mt-2 text-sm text-slate-300">
                      {[mov.origem && `Origem: ${mov.origem}`, mov.destino && `Destino: ${mov.destino}`, mov.observacao].filter(Boolean).join(' | ')}
                    </p>
                  )}
                </div>
                <time className="text-sm font-bold text-slate-300">{formatDate(mov.created_at)}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-6 text-center text-slate-300">
          Nenhuma movimentacao registrada.
        </div>
      )}
    </section>
  );
}
