import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { EQUIPES_TECNICAS, OS_AREAS, areaLabel } from '../../services/supervisaoService.js';

export default function SupervisaoActionModal({ action, os, contexto, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      equipe: os?.equipe || os?.equipe_responsavel || '',
      tecnico_responsavel: os?.tecnico_responsavel || os?.responsavel_id || '',
      data_programada: os?.data_programada || '',
      hora_programada: os?.hora_programada || '',
      turno: os?.turno || '',
      observacao: '',
      motivo: '',
      nova_area: '',
      justificativa: ''
    });
  }, [os?.id]);

  const title = useMemo(() => {
    const labels = {
      programar: 'Programar execução',
      corrigir: 'Solicitar correção',
      reencaminhar: 'Reencaminhar para outro supervisor'
    };
    return os ? `${labels[action] || 'Confirmar ação'} • ${os.numero}` : '';
  }, [action, os]);

  if (!os) return null;

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  const areas = contexto?.areas?.length ? contexto.areas.map((area) => ({ value: area.area, label: area.nome })) : OS_AREAS;

  return (
    <Modal
      open={Boolean(os)}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit" form="supervisao-action-form" disabled={saving}>{saving ? 'Salvando...' : 'Confirmar'}</button>
        </div>
      }
    >
      <form id="supervisao-action-form" className="grid gap-4" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-950/50 p-4">
          <strong className="text-white">{os.titulo}</strong>
          <p className="mt-1 text-sm text-slate-300">{os.ebap?.nome || '-'} • {areaLabel(os.area)} • {os.payload?.equipamento_falha || 'Equipamento não informado'}</p>
        </div>

        {action === 'programar' && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label md:col-span-2">Equipe responsável
              <select className="form-control" value={form.equipe} onChange={(event) => setField('equipe', event.target.value)} required>
                <option value="">Selecione...</option>
                {EQUIPES_TECNICAS.map((equipe) => <option key={equipe.value} value={equipe.value}>{equipe.label}</option>)}
              </select>
            </label>
            <label className="field-label">Data<input className="form-control" type="date" value={form.data_programada} onChange={(event) => setField('data_programada', event.target.value)} required /></label>
            <label className="field-label">Horário<input className="form-control" type="time" value={form.hora_programada} onChange={(event) => setField('hora_programada', event.target.value)} /></label>
            <label className="field-label">Turno
              <select className="form-control" value={form.turno} onChange={(event) => setField('turno', event.target.value)} required>
                <option value="">Selecione...</option>
                <option value="06:00 as 18:00">06:00 as 18:00</option>
                <option value="18:00 as 06:00">18:00 as 06:00</option>
              </select>
            </label>
            <label className="field-label md:col-span-2">Orientações<textarea className="form-control min-h-24 py-3" value={form.observacao} onChange={(event) => setField('observacao', event.target.value)} /></label>
          </div>
        )}

        {action === 'corrigir' && (
          <label className="field-label">Motivo obrigatório<textarea className="form-control min-h-28 py-3" value={form.motivo} onChange={(event) => setField('motivo', event.target.value)} required /></label>
        )}

        {action === 'reencaminhar' && (
          <div className="grid gap-4">
            <label className="field-label">Nova área
              <select className="form-control" value={form.nova_area} onChange={(event) => setField('nova_area', event.target.value)} required>
                <option value="">Selecione...</option>
                {areas.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
              </select>
            </label>
            <label className="field-label">Justificativa obrigatória<textarea className="form-control min-h-28 py-3" value={form.justificativa} onChange={(event) => setField('justificativa', event.target.value)} required /></label>
          </div>
        )}

        {!['programar', 'corrigir', 'reencaminhar'].includes(action) && (
          <p className="text-sm font-bold text-slate-300">Confirme a movimentação da OS na fila de supervisão.</p>
        )}
      </form>
    </Modal>
  );
}
