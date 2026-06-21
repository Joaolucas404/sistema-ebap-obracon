import { ClipboardList, ExternalLink, FileText, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EbapStatusBadge from './EbapStatusBadge.jsx';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : '-';
}

export default function EbapModal({ ebap, onClose }) {
  const navigate = useNavigate();
  if (!ebap) return null;

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-white">{ebap.nome}</h3>
            <p className="text-sm text-slate-300">Coordenadas: {ebap.latitude}, {ebap.longitude}</p>
          </div>
          <EbapStatusBadge status={ebap.status_operacional} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Info label="OS abertas" value={ebap.os_abertas || 0} />
          <Info label="RO pendentes" value={ebap.ro_pendentes || 0} />
          <Info label="Preventivas pendentes" value={ebap.preventivas_pendentes || 0} />
          <Info label="Ultima atualizacao" value={formatDate(ebap.updated_at || ebap.created_at)} />
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-2">
        <a className="primary-button justify-center" href={ebap.link_maps} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Abrir Google Maps
        </a>
        <button className="secondary-button justify-center" type="button" onClick={() => go(`/os?ebap=${ebap.id}`)}>
          <ClipboardList size={18} />
          Ver Ordens de Servico
        </button>
        <button className="secondary-button justify-center" type="button" onClick={() => go(`/relatorio?ebap=${ebap.id}`)}>
          <FileText size={18} />
          Ver Relatorios
        </button>
        <button className="secondary-button justify-center" type="button" onClick={() => go(`/manutencao?ebap=${ebap.id}`)}>
          <Wrench size={18} />
          Ver Manutencao
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-navy-950/45 p-3">
      <small className="font-black uppercase text-slate-400">{label}</small>
      <strong className="block text-white">{value}</strong>
    </div>
  );
}
