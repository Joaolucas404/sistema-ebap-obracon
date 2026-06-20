import { APR_STATUS, TREINAMENTO_STATUS } from '../../services/sstService.js';

export const blankEpi = {
  id: null,
  codigo: '',
  nome: '',
  ca: '',
  validade_ca: '',
  categoria: '',
  fabricante: '',
  estoque_minimo: 0,
  ativo: true
};

export const blankEntrega = {
  epi_id: '',
  funcionario_id: '',
  quantidade: 1,
  entregue_em: new Date().toISOString().slice(0, 10),
  validade_uso: '',
  os_id: '',
  observacoes: ''
};

export const blankTreinamento = {
  id: null,
  codigo: '',
  nome: '',
  norma: '',
  categoria: '',
  carga_horaria: '',
  validade_meses: '',
  obrigatorio: true,
  ativo: true
};

export const blankFuncionarioTreinamento = {
  treinamento_id: '',
  funcionario_id: '',
  realizado_em: '',
  valido_ate: '',
  os_id: '',
  status: '',
  observacoes: ''
};

export const blankApr = {
  id: null,
  codigo: '',
  os_id: '',
  ebap_id: '',
  atividade: '',
  local_atividade: '',
  riscos: '',
  medidas_controle: '',
  epis_obrigatorios: '',
  responsavel_id: '',
  status: 'rascunho',
  inicio_previsto: '',
  fim_previsto: '',
  observacoes: ''
};

function Actions({ saving, onCancel, label }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button className="secondary-button" type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="primary-button" type="submit" disabled={saving}>
        {saving ? 'Salvando...' : label}
      </button>
    </div>
  );
}

export function EpiForm({ form, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Codigo" value={form.codigo} onChange={(value) => onChange('codigo', value)} required minLength={2} />
        <Input label="Nome" value={form.nome} onChange={(value) => onChange('nome', value)} required minLength={3} />
        <Input label="CA" value={form.ca} onChange={(value) => onChange('ca', value)} />
        <Input label="Validade do CA" type="date" value={form.validade_ca || ''} onChange={(value) => onChange('validade_ca', value)} />
        <Input label="Categoria" value={form.categoria} onChange={(value) => onChange('categoria', value)} />
        <Input label="Fabricante" value={form.fabricante} onChange={(value) => onChange('fabricante', value)} />
        <Input label="Estoque minimo" type="number" min="0" value={form.estoque_minimo} onChange={(value) => onChange('estoque_minimo', value)} />
        <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm font-black text-slate-100">
          <input className="size-4 accent-green-500" type="checkbox" checked={form.ativo !== false} onChange={(event) => onChange('ativo', event.target.checked)} />
          EPI ativo
        </label>
      </div>
      <Actions saving={saving} onCancel={onCancel} label="Salvar EPI" />
    </form>
  );
}

export function EntregaEpiForm({ form, epis, funcionarios, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="EPI" value={form.epi_id} onChange={(value) => onChange('epi_id', value)} required>
          <option value="">Selecione...</option>
          {epis.map((epi) => <option key={epi.id} value={epi.id}>{epi.codigo} - {epi.nome}</option>)}
        </Select>
        <Select label="Funcionario" value={form.funcionario_id} onChange={(value) => onChange('funcionario_id', value)} required>
          <option value="">Selecione...</option>
          {funcionarios.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} - {funcionario.perfil}</option>)}
        </Select>
        <Input label="Quantidade" type="number" min="1" value={form.quantidade} onChange={(value) => onChange('quantidade', value)} required />
        <Input label="Data de entrega" type="date" value={form.entregue_em} onChange={(value) => onChange('entregue_em', value)} required />
        <Input label="Validade de uso" type="date" value={form.validade_uso || ''} onChange={(value) => onChange('validade_uso', value)} />
        <Input label="OS vinculada" value={form.os_id} onChange={(value) => onChange('os_id', value)} placeholder="UUID da OS, opcional" />
      </div>
      <Textarea label="Observacoes" value={form.observacoes} onChange={(value) => onChange('observacoes', value)} />
      <Actions saving={saving} onCancel={onCancel} label="Registrar entrega" />
    </form>
  );
}

export function TreinamentoForm({ form, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Codigo" value={form.codigo} onChange={(value) => onChange('codigo', value)} required minLength={2} />
        <Input label="Nome" value={form.nome} onChange={(value) => onChange('nome', value)} required minLength={3} />
        <Input label="Norma" value={form.norma} onChange={(value) => onChange('norma', value)} />
        <Input label="Categoria" value={form.categoria} onChange={(value) => onChange('categoria', value)} />
        <Input label="Carga horaria" type="number" min="0" step="0.5" value={form.carga_horaria} onChange={(value) => onChange('carga_horaria', value)} />
        <Input label="Validade em meses" type="number" min="1" value={form.validade_meses} onChange={(value) => onChange('validade_meses', value)} />
        <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm font-black text-slate-100">
          <input className="size-4 accent-green-500" type="checkbox" checked={form.obrigatorio !== false} onChange={(event) => onChange('obrigatorio', event.target.checked)} />
          Treinamento obrigatorio
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/35 p-4 text-sm font-black text-slate-100">
          <input className="size-4 accent-green-500" type="checkbox" checked={form.ativo !== false} onChange={(event) => onChange('ativo', event.target.checked)} />
          Treinamento ativo
        </label>
      </div>
      <Actions saving={saving} onCancel={onCancel} label="Salvar treinamento" />
    </form>
  );
}

export function FuncionarioTreinamentoForm({ form, treinamentos, funcionarios, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Treinamento" value={form.treinamento_id} onChange={(value) => onChange('treinamento_id', value)} required>
          <option value="">Selecione...</option>
          {treinamentos.map((treinamento) => <option key={treinamento.id} value={treinamento.id}>{treinamento.codigo} - {treinamento.nome}</option>)}
        </Select>
        <Select label="Funcionario" value={form.funcionario_id} onChange={(value) => onChange('funcionario_id', value)} required>
          <option value="">Selecione...</option>
          {funcionarios.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} - {funcionario.perfil}</option>)}
        </Select>
        <Input label="Realizado em" type="date" value={form.realizado_em || ''} onChange={(value) => onChange('realizado_em', value)} />
        <Input label="Valido ate" type="date" value={form.valido_ate || ''} onChange={(value) => onChange('valido_ate', value)} />
        <Select label="Status" value={form.status} onChange={(value) => onChange('status', value)}>
          <option value="">Automatico pelo vencimento</option>
          {TREINAMENTO_STATUS.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </Select>
        <Input label="OS vinculada" value={form.os_id} onChange={(value) => onChange('os_id', value)} placeholder="UUID da OS, opcional" />
      </div>
      <Textarea label="Observacoes" value={form.observacoes} onChange={(value) => onChange('observacoes', value)} />
      <Actions saving={saving} onCancel={onCancel} label="Registrar treinamento" />
    </form>
  );
}

export function AprForm({ form, funcionarios, ebaps, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Codigo" value={form.codigo} onChange={(value) => onChange('codigo', value)} required minLength={2} />
        <Select label="Status" value={form.status} onChange={(value) => onChange('status', value)} required>
          {APR_STATUS.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </Select>
        <Select label="EBAP" value={form.ebap_id} onChange={(value) => onChange('ebap_id', value)}>
          <option value="">Sem EBAP vinculada</option>
          {ebaps.map((ebap) => <option key={ebap.id} value={ebap.id}>{ebap.nome}</option>)}
        </Select>
        <Select label="Responsavel" value={form.responsavel_id} onChange={(value) => onChange('responsavel_id', value)}>
          <option value="">Sem responsavel</option>
          {funcionarios.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} - {funcionario.perfil}</option>)}
        </Select>
        <Input label="OS vinculada" value={form.os_id} onChange={(value) => onChange('os_id', value)} placeholder="UUID da OS, opcional" />
        <Input label="Local da atividade" value={form.local_atividade} onChange={(value) => onChange('local_atividade', value)} />
        <Input label="Inicio previsto" type="datetime-local" value={form.inicio_previsto || ''} onChange={(value) => onChange('inicio_previsto', value)} />
        <Input label="Fim previsto" type="datetime-local" value={form.fim_previsto || ''} onChange={(value) => onChange('fim_previsto', value)} />
      </div>
      <Textarea label="Atividade" value={form.atividade} onChange={(value) => onChange('atividade', value)} required />
      <Textarea label="Riscos identificados" value={form.riscos} onChange={(value) => onChange('riscos', value)} />
      <Textarea label="Medidas de controle" value={form.medidas_controle} onChange={(value) => onChange('medidas_controle', value)} />
      <Textarea label="EPIs obrigatorios" value={form.epis_obrigatorios} onChange={(value) => onChange('epis_obrigatorios', value)} />
      <Textarea label="Observacoes" value={form.observacoes} onChange={(value) => onChange('observacoes', value)} />
      <Actions saving={saving} onCancel={onCancel} label="Salvar APR" />
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
      <textarea className="form-control min-h-24 resize-y py-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}
