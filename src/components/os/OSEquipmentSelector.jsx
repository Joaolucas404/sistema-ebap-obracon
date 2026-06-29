import { useEffect, useState } from 'react';
import { listarEbaps } from '../../services/osService.js';
import { ativoStatusLabel, listarAtivosPorEbap } from '../../services/ativosService.js';

export default function OSEquipmentSelector({ ebapId, ativoId, equipamentoId, onChange, disabled = false }) {
  const [ebaps, setEbaps] = useState([]);
  const [ativos, setAtivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedId = ativoId || equipamentoId || '';

  useEffect(() => {
    listarEbaps().then(setEbaps).catch(() => setEbaps([]));
  }, []);

  useEffect(() => {
    setAtivos([]);
    if (!ebapId) return;
    setLoading(true);
    listarAtivosPorEbap(ebapId)
      .then(setAtivos)
      .catch(() => setAtivos([]))
      .finally(() => setLoading(false));
  }, [ebapId]);

  function handleAtivoChange(nextId) {
    const ativo = ativos.find((item) => item.id === nextId);
    onChange({
      ativo_id: nextId,
      equipamento_id: null,
      equipamento_falha: ativo?.nome_operacional || '',
      equipamento_tipo: ativo?.tipo || '',
      area: ativo?.area_responsavel || ''
    });
  }

  return (
    <>
      <label className="field-label">
        EBAP
        <select
          className="form-control"
          value={ebapId || ''}
          disabled={disabled}
          onChange={(event) => onChange({ ebap_id: event.target.value, ativo_id: '', equipamento_id: null, equipamento_falha: '', equipamento_tipo: '', area: '' })}
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
        Equipamento com falha
        <select
          className="form-control"
          value={selectedId}
          disabled={disabled || !ebapId || loading}
          onChange={(event) => handleAtivoChange(event.target.value)}
        >
          <option value="">{loading ? 'Carregando...' : 'Selecione um ativo cadastrado...'}</option>
          {ativos.map((ativo) => (
            <option key={ativo.id} value={ativo.id}>
              {ativo.nome_operacional} - {ativo.tipo} - {ativoStatusLabel(ativo.status_operacional)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
