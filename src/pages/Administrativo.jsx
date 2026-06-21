import { useEffect, useState } from 'react';
import { Building2, Car, FileUp, Plus, RefreshCcw, Stethoscope, Umbrella, UserPlus } from 'lucide-react';
import AdmDashboard from '../components/administrativo/AdmDashboard.jsx';
import {
  AtestadoForm,
  blankAtestado,
  blankColaborador,
  blankFerias,
  blankFrotaManutencao,
  blankVeiculo,
  ColaboradorForm,
  FeriasForm,
  FrotaManutencaoForm,
  VeiculoForm
} from '../components/administrativo/AdmForms.jsx';
import { ActionButtons, admFormat, GenericTable } from '../components/administrativo/AdmTables.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Toast from '../components/ui/Toast.jsx';
import { podeGerenciarAdministrativo } from '../services/administrativoService.js';
import { useAdministrativoStore } from '../store/administrativoStore.js';
import { useAuthStore } from '../store/authStore.js';

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'colaboradores', label: 'Colaboradores' },
  { key: 'ferias', label: 'Férias' },
  { key: 'atestados', label: 'Atestados' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'frota', label: 'Frota' },
  { key: 'manutencao', label: 'Manutenção frota' },
  { key: 'historico', label: 'Histórico' }
];

const tableMap = {
  colaborador: { tabela: 'adm_colaboradores', entidade_tipo: 'colaborador' },
  ferias: { tabela: 'adm_ferias', entidade_tipo: 'ferias' },
  atestado: { tabela: 'adm_atestados', entidade_tipo: 'atestado' },
  veiculo: { tabela: 'adm_veiculos', entidade_tipo: 'veiculo' },
  manutencao_frota: { tabela: 'adm_frota_manutencoes', entidade_tipo: 'manutencao_frota' }
};

export default function Administrativo() {
  const user = useAuthStore((state) => state.user);
  const {
    dashboard,
    colaboradores,
    ferias,
    atestados,
    documentos,
    veiculos,
    frotaManutencoes,
    historico,
    usuarios,
    sstColaboradores,
    fornecedores,
    manutencoes,
    loading,
    saving,
    error,
    carregarTudo,
    salvarColaborador,
    salvarFerias,
    salvarAtestado,
    salvarVeiculo,
    salvarManutencaoFrota,
    uploadDocumento,
    remover,
    abrirDocumento
  } = useAdministrativoStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState({ type: null, row: null });
  const [forms, setForms] = useState({
    colaborador: blankColaborador,
    ferias: blankFerias,
    atestado: blankAtestado,
    veiculo: blankVeiculo,
    manutencao_frota: blankFrotaManutencao,
    upload: { entidade_tipo: 'geral', entidade_id: '', tipo: 'documento', validade: '', file: null }
  });
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState({ message: '', tone: 'cyan' });

  const canManage = podeGerenciarAdministrativo(user?.perfil);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  function closeModal() {
    setModal({ type: null, row: null });
    setLocalError('');
  }

  function setForm(type, field, value) {
    setForms((current) => ({ ...current, [type]: { ...current[type], [field]: value } }));
  }

  function open(type, row = null) {
    const blank = { colaborador: blankColaborador, ferias: blankFerias, atestado: blankAtestado, veiculo: blankVeiculo, manutencao_frota: blankFrotaManutencao }[type];
    if (blank) setForms((current) => ({ ...current, [type]: row ? { ...blank, ...row } : blank }));
    setModal({ type, row });
    setLocalError('');
  }

  function openUpload(entidade_tipo = 'geral', row = null) {
    setForms((current) => ({ ...current, upload: { entidade_tipo, entidade_id: row?.id || '', tipo: 'documento', validade: '', file: null } }));
    setModal({ type: 'upload', row });
  }

  async function submit(event, type, action, success) {
    event.preventDefault();
    try {
      await action(forms[type], user);
      setToast({ message: success, tone: 'green' });
      closeModal();
    } catch (err) {
      setLocalError(err.message || 'Não foi possível salvar.');
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    try {
      await uploadDocumento(forms.upload, user);
      setToast({ message: 'Documento enviado.', tone: 'green' });
      closeModal();
      setActiveTab('documentos');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível enviar documento.');
    }
  }

  async function handleDelete(type, row) {
    try {
      await remover({ ...tableMap[type], id: row.id }, user);
      setToast({ message: 'Registro removido.', tone: 'orange' });
    } catch (err) {
      setLocalError(err.message || 'Não foi possível remover.');
    }
  }

  async function handleOpenDocument(documento) {
    try {
      const url = await abrirDocumento(documento);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setLocalError(err.message || 'Não foi possível abrir documento.');
    }
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Administrativo, RH, DP e Frota"
        description="Colaboradores, férias, atestados, documentos, frota, manutenção e alertas administrativos integrados ao SIGEBAP."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><Building2 size={24} /></span>}
        actions={
          <>
            <button className="secondary-button" type="button" onClick={carregarTudo} disabled={loading}>
              <RefreshCcw size={17} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            {canManage && (
              <>
                <button className="secondary-button" type="button" onClick={() => open('ferias')}><Umbrella size={18} />Férias</button>
                <button className="secondary-button" type="button" onClick={() => open('atestado')}><Stethoscope size={18} />Atestado</button>
                <button className="secondary-button" type="button" onClick={() => open('veiculo')}><Car size={18} />Veículo</button>
                <button className="secondary-button" type="button" onClick={() => openUpload()}><FileUp size={18} />Documento</button>
                <button className="primary-button" type="button" onClick={() => open('colaborador')}><UserPlus size={18} />Colaborador</button>
              </>
            )}
          </>
        }
      />

      {(error || localError) && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{localError || error}</div>}

      <section className="glass-card rounded-3xl p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => <button key={tab.key} type="button" className={activeTab === tab.key ? 'primary-button min-h-10' : 'secondary-button min-h-10'} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
        </div>
      </section>

      {activeTab === 'dashboard' && <AdmDashboard dashboard={dashboard} />}
      {activeTab === 'colaboradores' && (
        <GenericTable rows={colaboradores} empty="Nenhum colaborador cadastrado." columns={[
          { key: 'nome', label: 'Nome', render: (r) => <><strong className="block text-white">{r.nome}</strong><small>{r.matricula || '-'}</small></> },
          { key: 'cargo', label: 'Cargo' },
          { key: 'setor', label: 'Setor' },
          { key: 'status', label: 'Status' }
        ]} actions={(row) => <ActionButtons onUpload={() => openUpload('colaborador', row)} onEdit={() => open('colaborador', row)} onDelete={() => handleDelete('colaborador', row)} />} />
      )}
      {activeTab === 'ferias' && (
        <GenericTable rows={ferias} empty="Nenhuma férias registrada." columns={[
          { key: 'colaborador', label: 'Colaborador', render: (r) => r.colaborador?.nome || '-' },
          { key: 'inicio', label: 'Início', render: (r) => admFormat.date(r.inicio) },
          { key: 'fim', label: 'Fim', render: (r) => admFormat.date(r.fim) },
          { key: 'status', label: 'Status' }
        ]} actions={(row) => <ActionButtons onUpload={() => openUpload('ferias', row)} onEdit={() => open('ferias', row)} onDelete={() => handleDelete('ferias', row)} />} />
      )}
      {activeTab === 'atestados' && (
        <GenericTable rows={atestados} empty="Nenhum atestado registrado." columns={[
          { key: 'colaborador', label: 'Colaborador', render: (r) => r.colaborador?.nome || '-' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'inicio', label: 'Período', render: (r) => `${admFormat.date(r.inicio)} até ${admFormat.date(r.fim)}` },
          { key: 'status', label: 'Status' }
        ]} actions={(row) => <ActionButtons onUpload={() => openUpload('atestado', row)} onEdit={() => open('atestado', row)} onDelete={() => handleDelete('atestado', row)} />} />
      )}
      {activeTab === 'documentos' && (
        <GenericTable rows={documentos} empty="Nenhum documento anexado." columns={[
          { key: 'nome', label: 'Documento', render: (r) => <><strong className="block text-white">{r.nome}</strong><small>{r.tipo}</small></> },
          { key: 'entidade_tipo', label: 'Vínculo' },
          { key: 'validade', label: 'Validade', render: (r) => admFormat.date(r.validade) },
          { key: 'status', label: 'Status' }
        ]} actions={(row) => <ActionButtons onOpen={() => handleOpenDocument(row)} />} />
      )}
      {activeTab === 'frota' && (
        <GenericTable rows={veiculos} empty="Nenhum veículo cadastrado." columns={[
          { key: 'placa', label: 'Placa', render: (r) => <><strong className="block text-white">{r.placa}</strong><small>{r.prefixo || '-'}</small></> },
          { key: 'modelo', label: 'Modelo' },
          { key: 'km_atual', label: 'KM' },
          { key: 'status', label: 'Status' }
        ]} actions={(row) => <ActionButtons onUpload={() => openUpload('veiculo', row)} onEdit={() => open('veiculo', row)} onDelete={() => handleDelete('veiculo', row)} />} />
      )}
      {activeTab === 'manutencao' && (
        <>
          {canManage && <button className="primary-button w-fit" type="button" onClick={() => open('manutencao_frota')}><Plus size={18} />Nova manutenção</button>}
          <GenericTable rows={frotaManutencoes} empty="Nenhuma manutenção de frota registrada." columns={[
            { key: 'veiculo', label: 'Veículo', render: (r) => r.veiculo ? `${r.veiculo.placa} - ${r.veiculo.modelo}` : '-' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'data_programada', label: 'Programada', render: (r) => admFormat.date(r.data_programada) },
            { key: 'custo', label: 'Custo', render: (r) => admFormat.money(r.custo) },
            { key: 'status', label: 'Status' }
          ]} actions={(row) => <ActionButtons onUpload={() => openUpload('manutencao_frota', row)} onEdit={() => open('manutencao_frota', row)} onDelete={() => handleDelete('manutencao_frota', row)} />} />
        </>
      )}
      {activeTab === 'historico' && (
        <GenericTable rows={historico} empty="Sem histórico administrativo." columns={[
          { key: 'acao', label: 'Ação' },
          { key: 'entidade_tipo', label: 'Entidade' },
          { key: 'descricao', label: 'Descrição' },
          { key: 'created_at', label: 'Data', render: (r) => new Date(r.created_at).toLocaleString('pt-BR') }
        ]} actions={() => null} />
      )}

      <Modal open={modal.type === 'colaborador'} title="Colaborador" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<ColaboradorForm form={forms.colaborador} usuarios={usuarios} sstColaboradores={sstColaboradores} saving={saving} onChange={(f, v) => setForm('colaborador', f, v)} onSubmit={(e) => submit(e, 'colaborador', salvarColaborador, 'Colaborador salvo.')} onCancel={closeModal} /></Modal>
      <Modal open={modal.type === 'ferias'} title="Férias" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<FeriasForm form={forms.ferias} colaboradores={colaboradores} saving={saving} onChange={(f, v) => setForm('ferias', f, v)} onSubmit={(e) => submit(e, 'ferias', salvarFerias, 'Férias salvas.')} onCancel={closeModal} /></Modal>
      <Modal open={modal.type === 'atestado'} title="Atestado" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<AtestadoForm form={forms.atestado} colaboradores={colaboradores} saving={saving} onChange={(f, v) => setForm('atestado', f, v)} onSubmit={(e) => submit(e, 'atestado', salvarAtestado, 'Atestado salvo.')} onCancel={closeModal} /></Modal>
      <Modal open={modal.type === 'veiculo'} title="Veículo" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<VeiculoForm form={forms.veiculo} usuarios={usuarios} saving={saving} onChange={(f, v) => setForm('veiculo', f, v)} onSubmit={(e) => submit(e, 'veiculo', salvarVeiculo, 'Veículo salvo.')} onCancel={closeModal} /></Modal>
      <Modal open={modal.type === 'manutencao_frota'} title="Manutenção da frota" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<FrotaManutencaoForm form={forms.manutencao_frota} veiculos={veiculos} fornecedores={fornecedores} manutencoes={manutencoes} saving={saving} onChange={(f, v) => setForm('manutencao_frota', f, v)} onSubmit={(e) => submit(e, 'manutencao_frota', salvarManutencaoFrota, 'Manutenção salva.')} onCancel={closeModal} /></Modal>
      <Modal open={modal.type === 'upload'} title="Enviar documento" onClose={closeModal}>{localError && <ErrorBox message={localError} />}<form className="grid gap-4" onSubmit={handleUpload}><div className="grid gap-4 md:grid-cols-2"><label className="field-label">Tipo<input className="form-control" value={forms.upload.tipo} onChange={(e) => setForm('upload', 'tipo', e.target.value)} /></label><label className="field-label">Validade<input className="form-control" type="date" value={forms.upload.validade} onChange={(e) => setForm('upload', 'validade', e.target.value)} /></label></div><label className="field-label">Arquivo<input className="form-control py-3" type="file" required onChange={(e) => setForm('upload', 'file', e.target.files?.[0] || null)} /></label><div className="flex justify-end gap-2"><button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Enviar'}</button></div></form></Modal>

      <Toast message={toast.message} tone={toast.tone} onClose={() => setToast({ message: '', tone: 'cyan' })} />
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-500/15 p-3 text-sm font-bold text-red-100">{message}</div>;
}
