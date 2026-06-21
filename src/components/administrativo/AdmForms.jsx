export const blankColaborador = { nome: '', matricula: '', cpf: '', cargo: '', setor: '', tipo_contrato: 'clt', status: 'ativo', admissao_em: '', desligamento_em: '', salario_base: '', telefone: '', email: '', endereco: '', usuario_id: '', sst_colaborador_id: '', observacoes: '' };
export const blankFerias = { colaborador_id: '', periodo_aquisitivo_inicio: '', periodo_aquisitivo_fim: '', inicio: '', fim: '', dias: 30, abono: false, status: 'programada', observacoes: '' };
export const blankAtestado = { colaborador_id: '', tipo: 'medico', inicio: '', fim: '', dias: 1, cid: '', medico: '', status: 'registrado', observacoes: '' };
export const blankVeiculo = { placa: '', prefixo: '', modelo: '', marca: '', ano: '', tipo: 'leve', status: 'operacional', km_atual: 0, renavam: '', seguro_validade: '', licenciamento_validade: '', responsavel_id: '', observacoes: '' };
export const blankFrotaManutencao = { veiculo_id: '', manutencao_id: '', tipo: 'preventiva', descricao: '', km_execucao: '', data_programada: '', data_execucao: '', custo: '', fornecedor_id: '', status: 'programada', observacoes: '' };

export function mapForm(row, blank) {
  return Object.fromEntries(Object.keys(blank).map((key) => [key, row?.[key] ?? blank[key]])).id ? row : { ...blank, ...row };
}

export function ColaboradorForm({ form, usuarios, sstColaboradores, saving, onChange, onSubmit, onCancel }) {
  return (
    <Form onSubmit={onSubmit} saving={saving} label="Salvar colaborador" onCancel={onCancel}>
      <Grid>
        <Input label="Nome" value={form.nome} required onChange={(v) => onChange('nome', v)} />
        <Input label="Matrícula" value={form.matricula} onChange={(v) => onChange('matricula', v)} />
        <Input label="CPF" value={form.cpf} onChange={(v) => onChange('cpf', v)} />
        <Input label="Cargo" value={form.cargo} onChange={(v) => onChange('cargo', v)} />
        <Input label="Setor" value={form.setor} onChange={(v) => onChange('setor', v)} />
        <Select label="Status" value={form.status} options={['ativo','ferias','afastado','desligado','experiencia']} onChange={(v) => onChange('status', v)} />
        <Select label="Tipo contrato" value={form.tipo_contrato} options={['clt','pj','temporario','estagio','terceirizado','outro']} onChange={(v) => onChange('tipo_contrato', v)} />
        <Input label="Admissão" type="date" value={form.admissao_em} onChange={(v) => onChange('admissao_em', v)} />
        <Input label="Desligamento" type="date" value={form.desligamento_em} onChange={(v) => onChange('desligamento_em', v)} />
        <Input label="Salário base" type="number" value={form.salario_base} onChange={(v) => onChange('salario_base', v)} />
        <Input label="Telefone" value={form.telefone} onChange={(v) => onChange('telefone', v)} />
        <Input label="E-mail" type="email" value={form.email} onChange={(v) => onChange('email', v)} />
        <SelectItems label="Usuário" value={form.usuario_id} items={usuarios} onChange={(v) => onChange('usuario_id', v)} />
        <SelectItems label="Vínculo SST" value={form.sst_colaborador_id} items={sstColaboradores} onChange={(v) => onChange('sst_colaborador_id', v)} />
      </Grid>
      <Textarea label="Endereço" value={form.endereco} onChange={(v) => onChange('endereco', v)} />
      <Textarea label="Observações" value={form.observacoes} onChange={(v) => onChange('observacoes', v)} />
    </Form>
  );
}

export function FeriasForm({ form, colaboradores, saving, onChange, onSubmit, onCancel }) {
  return <Form onSubmit={onSubmit} saving={saving} label="Salvar férias" onCancel={onCancel}><Grid><SelectItems label="Colaborador" value={form.colaborador_id} items={colaboradores} required onChange={(v) => onChange('colaborador_id', v)} /><Input label="Período início" type="date" value={form.periodo_aquisitivo_inicio} required onChange={(v) => onChange('periodo_aquisitivo_inicio', v)} /><Input label="Período fim" type="date" value={form.periodo_aquisitivo_fim} required onChange={(v) => onChange('periodo_aquisitivo_fim', v)} /><Input label="Início" type="date" value={form.inicio} required onChange={(v) => onChange('inicio', v)} /><Input label="Fim" type="date" value={form.fim} required onChange={(v) => onChange('fim', v)} /><Input label="Dias" type="number" value={form.dias} required onChange={(v) => onChange('dias', v)} /><Select label="Status" value={form.status} options={['programada','em_andamento','concluida','cancelada','pendente_aprovacao']} onChange={(v) => onChange('status', v)} /></Grid><label className="flex items-center gap-2 text-sm font-bold text-slate-200"><input type="checkbox" checked={form.abono} onChange={(e) => onChange('abono', e.target.checked)} /> Abono pecuniário</label><Textarea label="Observações" value={form.observacoes} onChange={(v) => onChange('observacoes', v)} /></Form>;
}

export function AtestadoForm({ form, colaboradores, saving, onChange, onSubmit, onCancel }) {
  return <Form onSubmit={onSubmit} saving={saving} label="Salvar atestado" onCancel={onCancel}><Grid><SelectItems label="Colaborador" value={form.colaborador_id} items={colaboradores} required onChange={(v) => onChange('colaborador_id', v)} /><Select label="Tipo" value={form.tipo} options={['medico','odontologico','acidente_trabalho','comparecimento','outro']} onChange={(v) => onChange('tipo', v)} /><Input label="Início" type="date" value={form.inicio} required onChange={(v) => onChange('inicio', v)} /><Input label="Fim" type="date" value={form.fim} required onChange={(v) => onChange('fim', v)} /><Input label="Dias" type="number" value={form.dias} required onChange={(v) => onChange('dias', v)} /><Input label="CID" value={form.cid} onChange={(v) => onChange('cid', v)} /><Input label="Médico" value={form.medico} onChange={(v) => onChange('medico', v)} /><Select label="Status" value={form.status} options={['registrado','validado','rejeitado','arquivado']} onChange={(v) => onChange('status', v)} /></Grid><Textarea label="Observações" value={form.observacoes} onChange={(v) => onChange('observacoes', v)} /></Form>;
}

export function VeiculoForm({ form, usuarios, saving, onChange, onSubmit, onCancel }) {
  return <Form onSubmit={onSubmit} saving={saving} label="Salvar veículo" onCancel={onCancel}><Grid><Input label="Placa" value={form.placa} required onChange={(v) => onChange('placa', v)} /><Input label="Prefixo" value={form.prefixo} onChange={(v) => onChange('prefixo', v)} /><Input label="Modelo" value={form.modelo} required onChange={(v) => onChange('modelo', v)} /><Input label="Marca" value={form.marca} onChange={(v) => onChange('marca', v)} /><Input label="Ano" type="number" value={form.ano} onChange={(v) => onChange('ano', v)} /><Select label="Tipo" value={form.tipo} options={['leve','utilitario','caminhao','moto','equipamento','outro']} onChange={(v) => onChange('tipo', v)} /><Select label="Status" value={form.status} options={['operacional','manutencao','indisponivel','baixado']} onChange={(v) => onChange('status', v)} /><Input label="KM atual" type="number" value={form.km_atual} onChange={(v) => onChange('km_atual', v)} /><Input label="Renavam" value={form.renavam} onChange={(v) => onChange('renavam', v)} /><Input label="Seguro validade" type="date" value={form.seguro_validade} onChange={(v) => onChange('seguro_validade', v)} /><Input label="Licenciamento" type="date" value={form.licenciamento_validade} onChange={(v) => onChange('licenciamento_validade', v)} /><SelectItems label="Responsável" value={form.responsavel_id} items={usuarios} onChange={(v) => onChange('responsavel_id', v)} /></Grid><Textarea label="Observações" value={form.observacoes} onChange={(v) => onChange('observacoes', v)} /></Form>;
}

export function FrotaManutencaoForm({ form, veiculos, fornecedores, manutencoes, saving, onChange, onSubmit, onCancel }) {
  return <Form onSubmit={onSubmit} saving={saving} label="Salvar manutenção" onCancel={onCancel}><Grid><SelectItems label="Veículo" value={form.veiculo_id} items={veiculos} getLabel={(i) => `${i.placa} - ${i.modelo}`} required onChange={(v) => onChange('veiculo_id', v)} /><Select label="Tipo" value={form.tipo} options={['preventiva','corretiva','preditiva','documental','sinistro']} onChange={(v) => onChange('tipo', v)} /><Select label="Status" value={form.status} options={['programada','em_execucao','concluida','atrasada','cancelada']} onChange={(v) => onChange('status', v)} /><Input label="Data programada" type="date" value={form.data_programada} onChange={(v) => onChange('data_programada', v)} /><Input label="Data execução" type="date" value={form.data_execucao} onChange={(v) => onChange('data_execucao', v)} /><Input label="KM execução" type="number" value={form.km_execucao} onChange={(v) => onChange('km_execucao', v)} /><Input label="Custo" type="number" value={form.custo} onChange={(v) => onChange('custo', v)} /><SelectItems label="Fornecedor" value={form.fornecedor_id} items={fornecedores} onChange={(v) => onChange('fornecedor_id', v)} /><SelectItems label="Integração manutenção" value={form.manutencao_id} items={manutencoes} getLabel={(i) => i.plano?.nome || i.id} onChange={(v) => onChange('manutencao_id', v)} /></Grid><Textarea label="Descrição" value={form.descricao} required onChange={(v) => onChange('descricao', v)} /><Textarea label="Observações" value={form.observacoes} onChange={(v) => onChange('observacoes', v)} /></Form>;
}

function Form({ children, onSubmit, saving, label, onCancel }) {
  return <form className="grid gap-4" onSubmit={onSubmit}>{children}<div className="flex justify-end gap-2"><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : label}</button></div></form>;
}
function Grid({ children }) { return <div className="grid gap-4 md:grid-cols-2">{children}</div>; }
function Input({ label, value, onChange, ...props }) { return <label className="field-label">{label}<input className="form-control" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} /></label>; }
function Textarea({ label, value, onChange, ...props }) { return <label className="field-label">{label}<textarea className="form-control min-h-24 py-3" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} /></label>; }
function Select({ label, value, options, onChange }) { return <label className="field-label">{label}<select className="form-control" value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}</select></label>; }
function SelectItems({ label, value, items, onChange, required, getLabel }) { return <label className="field-label">{label}<select className="form-control" value={value || ''} required={required} onChange={(e) => onChange(e.target.value)}><option value="">{required ? 'Selecione' : 'Não informado'}</option>{items.map((item) => <option key={item.id} value={item.id}>{getLabel ? getLabel(item) : item.nome}</option>)}</select></label>; }
