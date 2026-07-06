import { AREAS_FINANCEIRAS, CONTRATO_STATUS, LANCAMENTO_STATUS, LANCAMENTO_TIPOS, MEDICAO_STATUS, PREFEITURA_STATUS } from '../../services/financeiroService.js';

export const blankContrato = {
  numero: '',
  fornecedor_id: '',
  ebap_id: '',
  tipo: 'prestacao_servico',
  objeto: '',
  valor_total: '',
  valor_executado: '',
  data_assinatura: '',
  data_inicio: '',
  data_fim: '',
  status: 'ativo',
  gestor_id: '',
  fiscal_id: '',
  fiscalizacao_status: 'pendente',
  observacoes: ''
};

export const blankMedicao = {
  contrato_id: '',
  codigo: '',
  numero: '',
  ebap_id: '',
  competencia_mes: new Date().getMonth() + 1,
  competencia_ano: new Date().getFullYear(),
  data_inicio: '',
  data_fim: '',
  valor_medido: '',
  valor_aprovado: '',
  valor_glosa: '',
  percentual_execucao: '',
  status: 'rascunho',
  prefeitura_status: 'nao_enviada',
  resumo: '',
  responsavel_id: ''
};

export const blankLancamento = {
  contrato_id: '',
  medicao_id: '',
  fornecedor_id: '',
  ebap_id: '',
  tipo: 'custo',
  categoria: '',
  descricao: '',
  valor: '',
  vencimento: '',
  pago_em: '',
  data_emissao: '',
  competencia_mes: '',
  competencia_ano: '',
  forma_pagamento: '',
  status: 'pendente',
  observacoes: ''
};

export function mapContratoToForm(row) {
  return { ...blankContrato, ...row, fornecedor_id: row.fornecedor_id || '', ebap_id: row.ebap_id || '', gestor_id: row.gestor_id || '', fiscal_id: row.fiscal_id || '' };
}

export function mapMedicaoToForm(row) {
  return { ...blankMedicao, ...row, contrato_id: row.contrato_id || '', ebap_id: row.ebap_id || '', responsavel_id: row.responsavel_id || '' };
}

export function mapLancamentoToForm(row) {
  return { ...blankLancamento, ...row, contrato_id: row.contrato_id || '', medicao_id: row.medicao_id || '', fornecedor_id: row.fornecedor_id || '', ebap_id: row.ebap_id || '' };
}

export function ContratoForm({ form, fornecedores, ebaps, usuarios, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Número" value={form.numero} required onChange={(value) => onChange('numero', value)} />
        <Select label="Status" value={form.status} options={CONTRATO_STATUS} onChange={(value) => onChange('status', value)} />
        <Select label="Fornecedor" value={form.fornecedor_id} items={fornecedores} onChange={(value) => onChange('fornecedor_id', value)} />
        <Select label="EBAP" value={form.ebap_id} items={ebaps} onChange={(value) => onChange('ebap_id', value)} />
        <Select label="Tipo" value={form.tipo} options={[
          { value: 'prestacao_servico', label: 'Prestação de serviço' },
          { value: 'fornecimento', label: 'Fornecimento' },
          { value: 'locacao', label: 'Locação' },
          { value: 'manutencao', label: 'Manutenção' },
          { value: 'obra', label: 'Obra' },
          { value: 'outro', label: 'Outro' }
        ]} onChange={(value) => onChange('tipo', value)} />
        <Select label="Fiscalização" value={form.fiscalizacao_status} options={[
          { value: 'pendente', label: 'Pendente' },
          { value: 'em_fiscalizacao', label: 'Em fiscalização' },
          { value: 'aprovada_prefeitura', label: 'Aprovada Prefeitura' },
          { value: 'reprovada_prefeitura', label: 'Reprovada Prefeitura' },
          { value: 'ajuste_solicitado', label: 'Ajuste solicitado' }
        ]} onChange={(value) => onChange('fiscalizacao_status', value)} />
        <Input label="Valor total" type="number" value={form.valor_total} onChange={(value) => onChange('valor_total', value)} />
        <Input label="Valor executado" type="number" value={form.valor_executado} onChange={(value) => onChange('valor_executado', value)} />
        <Input label="Data assinatura" type="date" value={form.data_assinatura || ''} onChange={(value) => onChange('data_assinatura', value)} />
        <Input label="Data início" type="date" value={form.data_inicio || ''} onChange={(value) => onChange('data_inicio', value)} />
        <Input label="Data fim" type="date" value={form.data_fim || ''} onChange={(value) => onChange('data_fim', value)} />
        <Select label="Gestor" value={form.gestor_id} items={usuarios} onChange={(value) => onChange('gestor_id', value)} />
        <Select label="Fiscal" value={form.fiscal_id} items={usuarios} onChange={(value) => onChange('fiscal_id', value)} />
      </div>
      <Textarea label="Objeto" value={form.objeto} required onChange={(value) => onChange('objeto', value)} />
      <Textarea label="Observações" value={form.observacoes || ''} onChange={(value) => onChange('observacoes', value)} />
      <Actions saving={saving} label="Salvar contrato" onCancel={onCancel} />
    </form>
  );
}

export function MedicaoForm({ form, contratos, ebaps, usuarios, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Contrato" value={form.contrato_id} items={contratos} getLabel={(item) => `${item.numero} - ${item.objeto}`} required onChange={(value) => onChange('contrato_id', value)} />
        <Select label="EBAP" value={form.ebap_id} items={ebaps} onChange={(value) => onChange('ebap_id', value)} />
        <Input label="Código" value={form.codigo || ''} placeholder="Automático se vazio" onChange={(value) => onChange('codigo', value)} />
        <Input label="Número externo" value={form.numero || ''} onChange={(value) => onChange('numero', value)} />
        <Input label="Competência mês" type="number" min="1" max="12" value={form.competencia_mes} required onChange={(value) => onChange('competencia_mes', value)} />
        <Input label="Competência ano" type="number" min="2000" max="2100" value={form.competencia_ano} required onChange={(value) => onChange('competencia_ano', value)} />
        <Input label="Data início" type="date" value={form.data_inicio || ''} onChange={(value) => onChange('data_inicio', value)} />
        <Input label="Data fim" type="date" value={form.data_fim || ''} onChange={(value) => onChange('data_fim', value)} />
        <Input label="Valor medido" type="number" value={form.valor_medido} onChange={(value) => onChange('valor_medido', value)} />
        <Input label="Valor aprovado" type="number" value={form.valor_aprovado || ''} onChange={(value) => onChange('valor_aprovado', value)} />
        <Input label="Glosa" type="number" value={form.valor_glosa} onChange={(value) => onChange('valor_glosa', value)} />
        <Input label="% execução" type="number" min="0" max="100" value={form.percentual_execucao} onChange={(value) => onChange('percentual_execucao', value)} />
        <Select label="Status" value={form.status} options={MEDICAO_STATUS} onChange={(value) => onChange('status', value)} />
        <Select label="Prefeitura" value={form.prefeitura_status} options={PREFEITURA_STATUS} onChange={(value) => onChange('prefeitura_status', value)} />
        <Select label="Responsável" value={form.responsavel_id} items={usuarios} onChange={(value) => onChange('responsavel_id', value)} />
      </div>
      <Textarea label="Resumo da medição" value={form.resumo || ''} onChange={(value) => onChange('resumo', value)} />
      <Actions saving={saving} label="Salvar medição" onCancel={onCancel} />
    </form>
  );
}

export function LancamentoForm({ form, contratos, medições, fornecedores, ebaps, saving, onChange, onSubmit, onCancel }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Contrato" value={form.contrato_id} items={contratos} getLabel={(item) => `${item.numero} - ${item.objeto}`} onChange={(value) => onChange('contrato_id', value)} />
        <Select label="Medição" value={form.medicao_id} items={medições} getLabel={(item) => item.numero || item.codigo} onChange={(value) => onChange('medicao_id', value)} />
        <Select label="Fornecedor" value={form.fornecedor_id} items={fornecedores} onChange={(value) => onChange('fornecedor_id', value)} />
        <Select label="EBAP" value={form.ebap_id} items={ebaps} onChange={(value) => onChange('ebap_id', value)} />
        <Select label="Tipo" value={form.tipo} options={LANCAMENTO_TIPOS} onChange={(value) => onChange('tipo', value)} />
        <Select label="Área/Categoria" value={form.categoria} options={AREAS_FINANCEIRAS} allowEmpty onChange={(value) => onChange('categoria', value)} />
        <Input label="Valor" type="number" value={form.valor} required onChange={(value) => onChange('valor', value)} />
        <Input label="Vencimento" type="date" value={form.vencimento || ''} onChange={(value) => onChange('vencimento', value)} />
        <Input label="Data emissão" type="date" value={form.data_emissao || ''} onChange={(value) => onChange('data_emissao', value)} />
        <Input label="Pago em" type="date" value={form.pago_em || ''} onChange={(value) => onChange('pago_em', value)} />
        <Input label="Competência mês" type="number" min="1" max="12" value={form.competencia_mes || ''} onChange={(value) => onChange('competencia_mes', value)} />
        <Input label="Competência ano" type="number" min="2000" max="2100" value={form.competencia_ano || ''} onChange={(value) => onChange('competencia_ano', value)} />
        <Input label="Forma pagamento" value={form.forma_pagamento || ''} onChange={(value) => onChange('forma_pagamento', value)} />
        <Select label="Status" value={form.status} options={LANCAMENTO_STATUS} onChange={(value) => onChange('status', value)} />
      </div>
      <Textarea label="Descrição" value={form.descricao} required onChange={(value) => onChange('descricao', value)} />
      <Textarea label="Observações" value={form.observacoes || ''} onChange={(value) => onChange('observacoes', value)} />
      <Actions saving={saving} label="Salvar lançamento" onCancel={onCancel} />
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

function Textarea({ label, value, onChange, ...props }) {
  return (
    <label className="field-label">
      {label}
      <textarea className="form-control min-h-24 py-3" value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function Select({ label, value, onChange, options, items, getLabel, required, allowEmpty }) {
  return (
    <label className="field-label">
      {label}
      <select className="form-control" value={value || ''} required={required} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allowEmpty || !required ? 'Não informado' : 'Selecione'}</option>
        {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        {items?.map((item) => <option key={item.id} value={item.id}>{getLabel ? getLabel(item) : item.nome}</option>)}
      </select>
    </label>
  );
}

function Actions({ saving, label, onCancel }) {
  return (
    <div className="flex justify-end gap-2">
      <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : label}</button>
    </div>
  );
}
