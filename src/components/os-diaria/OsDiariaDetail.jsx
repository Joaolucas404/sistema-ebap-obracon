import { FileImage, ShieldCheck } from 'lucide-react';
import OSTimeline from '../os/OSTimeline.jsx';
import { areaLabel, formatDuration, osExigeSst, prioridadeLabel, statusLabel } from '../../services/osDiariaService.js';

export default function OsDiariaDetail({ detail }) {
  if (!detail?.os) return <div className="text-slate-300">Selecione uma OS.</div>;

  const { os, historico = [], anexos = [], sst = {} } = detail;
  const exec = os.payload?.execucao_diaria || {};
  const sstCount = (sst.aprs?.length || 0) + (sst.apts?.length || 0);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h3 className="text-2xl font-black text-white">{os.numero}</h3>
        <p className="font-bold text-slate-200">{os.titulo}</p>
        <p className="mt-2 text-sm text-slate-300">{os.descricao}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Info label="Status" value={statusLabel(os.status)} />
          <Info label="Area" value={areaLabel(os.area)} />
          <Info label="Prioridade" value={prioridadeLabel(os.prioridade)} />
          <Info label="Tempo total" value={formatDuration(exec.tempo_total_segundos)} />
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><ShieldCheck size={20} /> SST</h4>
        <div className={`rounded-2xl border p-4 text-sm font-bold ${osExigeSst(os) && !sstCount ? 'border-red-300/30 bg-red-500/15 text-red-100' : 'border-green-300/30 bg-green-500/15 text-green-100'}`}>
          {osExigeSst(os) ? `APR/APT exigida - ${sstCount ? 'documento vinculado' : 'pendente'}` : 'APR/APT nao obrigatoria para esta OS.'}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><FileImage size={20} /> Fotos</h4>
        <div className="grid gap-3 md:grid-cols-3">
          {anexos.length ? anexos.map((anexo) => (
            <div key={anexo.id} className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
              <strong className="block truncate text-white">{anexo.nome_original}</strong>
              <small className="text-slate-400">{anexo.categoria || anexo.legenda || 'Foto'}</small>
            </div>
          )) : <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-4 text-sm text-slate-300">Nenhuma foto enviada.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <h4 className="mb-3 text-lg font-black text-white">Histórico</h4>
        <OSTimeline historico={historico} statusAtual={os.status} os={os} />
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block text-white">{value || '-'}</strong>
    </div>
  );
}
