import { CHECKLISTS_PADRAO, MANUTENCAO_AREAS, MANUTENCAO_FREQUENCIAS, MANUTENCAO_TIPOS } from '../../services/manutencaoService.js';

export const blankPlanoManutencao = {
  id: null,
  codigo: '',
  nome: '',
  ebap_id: '',
  area: 'mecanica',
  equipamento_id: '',
  frequencia: 'mensal',
  responsavel_id: '',
  checklist: CHECKLISTS_PADRAO.mecanica.join('\n'),
  tipo: 'preventiva',
  prioridade: 'media',
  proxima_execucao: new Date().toISOString().slice(0, 10),
  ativo: true,
  observacoes: ''
};

export function mapPlanoToForm(plano) {
  return {
    id: plano.id,
    codigo: plano.codigo || '',
    nome: plano.nome || '',
    ebap_id: plano.ebap_id || '',
    area: plano.area || 'mecanica',
    equipamento_id: plano.equipamento_id || '',
    frequencia: plano.frequencia || 'mensal',
    responsavel_id: plano.responsavel_id || '',
    checklist: Array.isArray(plano.checklist) ? plano.checklist.join('\n') : '',
    tipo: plano.tipo || 'preventiva',
    prioridade: plano.prioridade || 'media',
    proxima_execucao: plano.proxima_execucao || new Date().toISOString().slice(0, 10),
    ativo: plano.ativo !== false,
    observacoes: plano.observacoes || ''
  };
}

export default function PlanoManutencaoForm({ form, ebaps, equipamentos, responsaveis, saving, onChange, onSubmit, onCancel }) {
  const equipamentosFiltrados = equipamentos.filter((equipamento) => !form.ebap_id || equipamento.ebap_id === form.ebap_id);

  function changeArea(area) {
    onChange('area', area);
    onChange('checklist', CHECKLISTS_PADRAO[area]?.join('\n') || form.checklist);
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Codigo" value={form.codigo} onChange={(value) => onChange('codigo', value)} required minLength={2} />
        <Input label="Nome" value={form.nome} onChange={(value) => onChange('nome', value)} required minLength={3} />

        <Select label="EBAP" value={form.ebap_id} onChange={(value) => onChange('ebap_id', value)}>
          <option value="">Sem EBAP</option>
          {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
        </Select>

        <Select label="Area" value={form.area} onChange={changeArea} required>
          {MANUTENCAO_AREAS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
        </Select>

        <Select label="Equipamento" value={form.equipamento_id} onChange={(value) => onChange('equipamento_id', value)}>
          <option value="">Sem equipamento especifico</option>
          {equipamentosFiltrados.map((equipamento) => <option key={equipamento.id} value={equipamento.id}>{equipamento.tag || equipamento.codigo || '-'} - {equipamento.nome}</option>)}
        </Select>

        <Select label="Frequencia" value={form.frequencia} onChange={(value) => onChange('frequencia', value)} required>
          {MANUTENCAO_FREQUENCIAS.map((freq) => <option key={freq.value} value={freq.value}>{freq.label}</option>)}
        </Select>

        <Select label="Responsavel" value={form.responsavel_id} onChange={(value) => onChange('responsavel_id', value)}>
          <option value="">Sem responsavel</option>
          {responsaveis.map((resp) => <option key={resp.id} value={resp.id}>{resp.nome} - {resp.perfil}</option>)}
        </Select>

        <Select label="Tipo" value={form.tipo} onChange={(value) => onChange('tipo', value)} required>
          {MANUTENCAO_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </Select>

        <Select label="Prioridade" value={form.prioridade} onChange={(value) => onChange('prioridade', value)} required>
          {['baixa', 'media', 'alta', 'critica'].map((prioridade) => <option key={prioridade} value={prioridade}>{prioridade}</option>)}
        </Select>

        <Input label="Proxima execucao" type="date" value={form.proxima_execucao} onChange={(value) => onChange('proxima_execucao', value)} required />

        <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm font-black text-slate-100">
          <input className="size-4 accent-green-500" type="checkbox" checked={form.ativo !== false} onChange={(event) => onChange('ativo', event.target.checked)} />
          Plano ativo
        </label>
      </div>

      <Textarea label="Checklist" value={form.checklist} onChange={(value) => onChange('checklist', value)} required />
      <Textarea label="Observacoes" value={form.observacoes} onChange={(value) => onChange('observacoes', value)} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar plano'}</button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <label className="field-label">
      {label}
      <input className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function Select({ label, value, onChange, children, ...props }) {
  return (
    <label className="field-label">
      {label}
      <select className="form-control" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props}>
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, ...props }) {
  return (
    <label className="field-label">
      {label}
      <textarea className="form-control min-h-28 resize-y py-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}
