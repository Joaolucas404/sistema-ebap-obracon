import { useEffect, useState } from 'react';
import { listarEbaps, listarEquipamentosPorEbap } from '../../services/osService.js';

export default function OSEquipmentSelector({ ebapId, equipamentoId, onChange, disabled = false }) {
  const [ebaps, setEbaps] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listarEbaps().then(setEbaps).catch(() => setEbaps([]));
  }, []);

  useEffect(() => {
    setEquipamentos([]);
    if (!ebapId) return;
    setLoading(true);
    listarEquipamentosPorEbap(ebapId)
      .then(setEquipamentos)
      .catch(() => setEquipamentos([]))
      .finally(() => setLoading(false));
  }, [ebapId]);

  return (
    <>
      <label className="field-label">
        EBAP
        <select
          className="form-control"
          value={ebapId || ''}
          disabled={disabled}
          onChange={(event) => onChange({ ebap_id: event.target.value, equipamento_id: '' })}
        >
          <option value="">Selecione...</option>
          {ebaps.map((ebap) => (
            <option key={ebap.id} value={ebap.id}>
              {ebap.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Equipamento
        <select
          className="form-control"
          value={equipamentoId || ''}
          disabled={disabled || !ebapId || loading}
          onChange={(event) => onChange({ equipamento_id: event.target.value })}
        >
          <option value="">{loading ? 'Carregando...' : 'Selecione...'}</option>
          {equipamentos.map((equipamento) => (
            <option key={equipamento.id} value={equipamento.id}>
              {equipamento.tag ? `${equipamento.tag} - ` : ''}
              {equipamento.nome}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
