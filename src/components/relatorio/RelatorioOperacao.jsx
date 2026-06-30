import { useEffect, useMemo, useState } from 'react';
import { getTurnoAtual } from '../../services/relatorioService.js';

const CLIMA_OPTIONS = [
  { value: 'sem_chuva', label: 'Sem chuva', icon: '☀️' },
  { value: 'chuva_fraca', label: 'Chuva fraca', icon: '🌦️' },
  { value: 'chuva_moderada', label: 'Chuva moderada', icon: '🌧️' },
  { value: 'chuva_intensa', label: 'Chuva intensa', icon: '⛈️' }
];

export default function RelatorioOperacao({ data, onChange }) {
  const [now, setNow] = useState(() => new Date());
  const turnoAtual = useMemo(() => getTurnoAtual(now), [now]);
  const turnoLabel = turnoAtual === '06-18' ? 'Dia - 06:00 as 18:00' : 'Noite - 18:00 as 06:00';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data?.turno !== turnoAtual) {
      onChange({ ...data, turno: turnoAtual });
    }
  }, [data, onChange, turnoAtual]);

  function setField(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <section className="glass-card rounded-3xl p-5">
      <h3 className="mb-4 text-xl font-black text-white">Dados Gerais</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Turno
          <input className="form-control cursor-not-allowed bg-navy-950/70 text-white" value={turnoLabel} readOnly />
        </label>
        <label className="field-label md:col-span-2">
          Condição climática
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CLIMA_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={data.clima === option.value ? 'primary-button' : 'secondary-button'}
                type="button"
                onClick={() => setField('clima', option.value)}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </label>
        <label className="field-label">
          Nível de maré
          <div className="relative">
            <input
              className="form-control pr-14"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex.: 1.25"
              value={data.nivel_geral || ''}
              onChange={(event) => setField('nivel_geral', event.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">m</span>
          </div>
        </label>
        <label className="field-label md:col-span-2">
          Observacao geral
          <textarea className="form-control min-h-28 py-3" value={data.observacao || ''} onChange={(event) => setField('observacao', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
