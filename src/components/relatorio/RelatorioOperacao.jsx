import { useEffect, useMemo, useState } from 'react';
import { getTurnoAtual } from '../../services/relatorioService.js';

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
        <label className="field-label">
          Condicao climatica
          <select className="form-control" value={data.clima || ''} onChange={(event) => setField('clima', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="chuva">Chuva</option>
            <option value="chuva_intensa">Chuva intensa</option>
            <option value="alerta">Alerta operacional</option>
          </select>
        </label>
        <label className="field-label">
          Nivel geral
          <select className="form-control" value={data.nivel_geral || ''} onChange={(event) => setField('nivel_geral', event.target.value)}>
            <option value="">Selecione...</option>
            <option value="normal">Normal</option>
            <option value="elevado">Elevado</option>
            <option value="critico">Critico</option>
            <option value="baixo">Baixo</option>
          </select>
        </label>
        <label className="field-label md:col-span-2">
          Observacao geral
          <textarea className="form-control min-h-28 py-3" value={data.observacao || ''} onChange={(event) => setField('observacao', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
