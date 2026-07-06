import { AlertTriangle, BadgeDollarSign, Banknote, ClipboardCheck, FileText, Landmark, ReceiptText, WalletCards } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinanceiroDashboard({ dashboard }) {
  const data = dashboard || {};
  const percentualExecutado = data.valorContratado > 0 ? Math.min(100, Math.round((data.valorExecutado / data.valorContratado) * 100)) : 0;

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={WalletCards} label="Contratos ativos" value={data.contratosAtivos || 0} helper={`${data.contratosVencendo || 0} vencendo em 60 dias`} tone="cyan" />
        <KpiCard icon={ClipboardCheck} label="Medições pendentes" value={data.mediçõesPendentes || 0} helper={`${data.mediçõesPrefeitura || 0} em fiscalização`} tone="orange" />
        <KpiCard icon={ReceiptText} label="Lançamentos pendentes" value={data.lancamentosPendentes || 0} helper={`${data.lancamentosAtrasados || 0} atrasado(s)`} tone="red" />
        <KpiCard icon={BadgeDollarSign} label="Saldo contratual" value={money(data.saldoContratual)} helper="Contratado menos executado" tone="green" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Landmark size={22} /></span>
            <div>
              <h3 className="text-xl font-black text-white">Visão financeira do contrato</h3>
              <p className="text-sm text-slate-300">Execução consolidada com base em contratos, medições e lançamentos.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Valor contratado" value={money(data.valorContratado)} />
            <Metric label="Valor executado" value={money(data.valorExecutado)} />
            <Metric label="Valor medido" value={money(data.valorMedido)} />
            <Metric label="Valor aprovado" value={money(data.valorAprovado)} />
            <Metric label="Contas pendentes" value={money(data.valorPendente)} />
            <Metric label="Execução do plano" value={`${percentualExecutado}%`} />
          </div>
          <div className="mt-5 h-3 rounded-full bg-navy-950">
            <div className="h-3 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-emerald-400" style={{ width: `${percentualExecutado}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-navy-950/60 text-amber-100"><AlertTriangle size={22} /></span>
            <div>
              <h3 className="text-xl font-black text-white">Atenções</h3>
              <p className="text-sm text-slate-300">Pontos que exigem acompanhamento gerencial.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <AlertLine icon={FileText} label="Medições aguardando análise" value={data.mediçõesPendentes || 0} />
            <AlertLine icon={Banknote} label="Lançamentos vencidos ou atrasados" value={data.lancamentosAtrasados || 0} />
            <AlertLine icon={WalletCards} label="Contratos próximos do fim" value={data.contratosVencendo || 0} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-navy-950/55 p-4">
      <span className="text-xs font-black uppercase text-slate-400">{label}</span>
      <strong className="mt-2 block text-xl font-black text-white">{value}</strong>
    </div>
  );
}

function AlertLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-3">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-200"><Icon size={17} className="text-cyan-100" />{label}</span>
      <strong className="text-xl font-black text-white">{value}</strong>
    </div>
  );
}
