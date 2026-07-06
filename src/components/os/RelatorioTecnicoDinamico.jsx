import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, ImagePlus, Wrench, XCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'conforme', label: 'Conforme', icon: CheckCircle2, classes: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100' },
  { value: 'atencao', label: 'Atenção', icon: AlertTriangle, classes: 'border-amber-300/40 bg-amber-500/15 text-amber-100' },
  { value: 'nao_conforme', label: 'Não Conforme', icon: XCircle, classes: 'border-rose-400/40 bg-rose-500/15 text-rose-100' }
];

const DEFAULT_MEDICOES = [
  { chave: 'temperatura', label: 'Temperatura', unidade: '°C' },
  { chave: 'pressao', label: 'Pressão', unidade: 'bar' },
  { chave: 'corrente', label: 'Corrente', unidade: 'A' },
  { chave: 'tensao', label: 'Tensão', unidade: 'V' },
  { chave: 'nivel', label: 'Nível', unidade: '%' },
  { chave: 'vibracao', label: 'Vibração', unidade: 'mm/s' },
  { chave: 'outros', label: 'Outros', unidade: '' }
];

function groupCampos(campos = []) {
  return campos.reduce((acc, campo) => {
    const grupo = campo.grupo || 'dados';
    acc[grupo] = acc[grupo] || [];
    acc[grupo].push(campo);
    return acc;
  }, {});
}

function normalizeChecklistResposta(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      status: value.status || '',
      observacao: value.observacao || '',
      medições: value.medições || {}
    };
  }

  if (value === true) return { status: 'conforme', observacao: '', medições: {} };
  if (typeof value === 'string') return { status: value, observacao: '', medições: {} };
  return { status: '', observacao: '', medições: {} };
}

function normalizeMedições(campo) {
  const configured = campo?.metadata?.medições || campo?.opcoes?.medições || campo?.medições;
  const source = Array.isArray(configured) && configured.length ? configured : DEFAULT_MEDICOES;

  return source.map((item) => {
    if (typeof item === 'string') {
      return { chave: item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'), label: item, unidade: '' };
    }
    return {
      chave: item.chave || item.key || item.nome || item.label,
      label: item.label || item.nome || item.chave || item.key,
      unidade: item.unidade || item.unit || ''
    };
  }).filter((item) => item.chave);
}

function checklistResumo(campos = [], respostas = {}) {
  return campos.reduce((acc, campo) => {
    const resposta = normalizeChecklistResposta(respostas[campo.chave]);
    if (resposta.status === 'conforme') acc.conformes += 1;
    else if (resposta.status === 'atencao') acc.atencao += 1;
    else if (resposta.status === 'nao_conforme') acc.naoConformes += 1;
    else acc.pendentes += 1;
    return acc;
  }, { conformes: 0, atencao: 0, naoConformes: 0, pendentes: 0 });
}

export default function RelatorioTecnicoDinamico({
  modelos,
  value,
  onChange,
  disabled = false
}) {
  const selectedModelo = modelos.find((modelo) => modelo.id === value.modelo_id) || modelos[0];
  const grupos = groupCampos(selectedModelo?.campos || []);
  const checklistCampos = grupos.checklist || [];
  const resumo = checklistResumo(checklistCampos, value.respostas || {});

  function setValue(path, nextValue) {
    onChange({
      ...value,
      [path]: nextValue
    });
  }

  function setResposta(chave, nextValue) {
    setValue('respostas', {
      ...(value.respostas || {}),
      [chave]: nextValue
    });
  }

  function patchChecklistResposta(chave, patch) {
    const current = normalizeChecklistResposta((value.respostas || {})[chave]);
    setResposta(chave, {
      ...current,
      ...patch,
      medições: {
        ...(current.medições || {}),
        ...(patch.medições || {})
      }
    });
  }

  function setFoto(chave, patch) {
    setValue('fotos', {
      ...(value.fotos || {}),
      [chave]: {
        ...((value.fotos || {})[chave] || {}),
        ...patch
      }
    });
  }

  if (!modelos.length) {
    return (
      <div className="rounded-2xl border border-orange-300/30 bg-orange-500/10 p-4 text-sm font-bold text-orange-100">
        Nenhum modelo técnico dinâmico encontrado para esta OS. A conclusão da execução continua disponível.
      </div>
    );
  }

  return (
    <section className="grid gap-4 rounded-3xl border border-cyan-300/15 bg-navy-950/45 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-100">
          <Wrench size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-white">Checklist técnico</h3>
          <p className="text-sm text-slate-300">
            Itens de verificação, medições e fotos vinculadas diretamente às etapas do modelo.
          </p>
        </div>
      </div>

      <label className="field-label">
        Modelo de relatório
        <select
          className="form-control"
          value={value.modelo_id || selectedModelo?.id || ''}
          onChange={(event) => setValue('modelo_id', event.target.value)}
          disabled={disabled}
          required
        >
          {modelos.map((modelo) => (
            <option key={modelo.id} value={modelo.id}>
              {modelo.equipamento_tipo} - {modelo.tipo_manutencao}
            </option>
          ))}
        </select>
      </label>

      {selectedModelo?.resumo && (
        <div className="rounded-2xl border border-cyan-300/15 bg-navy-900/70 p-4 text-sm text-slate-200">
          <strong className="block text-white">{selectedModelo.titulo}</strong>
          <span>{selectedModelo.resumo}</span>
        </div>
      )}

      {!!checklistCampos.length && (
        <div className="grid gap-2 sm:grid-cols-4">
          <ResumoCard label="Conformes" value={resumo.conformes} tone="emerald" />
          <ResumoCard label="Atenção" value={resumo.atencao} tone="amber" />
          <ResumoCard label="Não conformes" value={resumo.naoConformes} tone="rose" />
          <ResumoCard label="Pendentes" value={resumo.pendentes} tone="slate" />
        </div>
      )}

      <CampoGrupo title="Checklist técnico" icon={<ClipboardCheck size={18} />} campos={checklistCampos} columns="single">
        {(campo) => (
          <ChecklistItem
            key={campo.id}
            campo={campo}
            resposta={normalizeChecklistResposta((value.respostas || {})[campo.chave])}
            foto={(value.fotos || {})[`checklist_${campo.chave}`] || {}}
            disabled={disabled}
            onPatch={(patch) => patchChecklistResposta(campo.chave, patch)}
            onFoto={(patch) => setFoto(`checklist_${campo.chave}`, {
              label: campo.label,
              legenda: patch.legenda || `Checklist - ${campo.label}`,
              item_chave: campo.chave,
              item_label: campo.label,
              categoria: 'checklist_item_foto',
              ...patch
            })}
          />
        )}
      </CampoGrupo>

      <CampoGrupo title="Fotos obrigatórias" icon={<ImagePlus size={18} />} campos={grupos.fotos}>
        {(campo) => {
          const foto = (value.fotos || {})[campo.chave] || {};
          return (
            <div key={campo.id} className="grid gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-3">
              <div>
                <strong className="block text-sm text-white">{campo.label}</strong>
                <small className="text-slate-400">{campo.obrigatorio ? 'Obrigatória' : 'Complementar'}</small>
              </div>
              <input
                className="form-control py-3"
                type="file"
                accept="image/*"
                onChange={(event) => setFoto(campo.chave, { file: event.target.files?.[0] || null, label: campo.label })}
                disabled={disabled}
                required={campo.obrigatorio && !foto.file}
              />
              <input
                className="form-control"
                value={foto.legenda || ''}
                onChange={(event) => setFoto(campo.chave, { legenda: event.target.value, label: campo.label })}
                placeholder="Legenda da foto"
                disabled={disabled}
              />
            </div>
          );
        }}
      </CampoGrupo>
    </section>
  );
}

function ResumoCard({ label, value, tone }) {
  const tones = {
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    amber: 'border-amber-300/25 bg-amber-500/10 text-amber-100',
    rose: 'border-rose-400/25 bg-rose-500/10 text-rose-100',
    slate: 'border-slate-500/25 bg-slate-500/10 text-slate-100'
  };

  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.slate}`}>
      <span className="text-xs font-black uppercase tracking-wide opacity-80">{label}</span>
      <strong className="mt-1 block text-2xl font-black">{value}</strong>
    </div>
  );
}

function ChecklistItem({ campo, resposta, foto, disabled, onPatch, onFoto }) {
  const precisaObservacao = resposta.status === 'atencao' || resposta.status === 'nao_conforme';
  const medições = normalizeMedições(campo);

  return (
    <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <strong className="block text-base text-white">{campo.label}</strong>
          {campo.obrigatorio && <small className="font-bold text-cyan-100">Item obrigatório</small>}
        </div>
        <input className="sr-only" value={resposta.status} onChange={() => {}} required={campo.obrigatorio} />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = resposta.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-black transition ${
                active ? option.classes : 'border-cyan-300/10 bg-navy-900/70 text-slate-300 hover:border-cyan-300/30'
              }`}
              onClick={() => onPatch({ status: option.value })}
              disabled={disabled}
            >
              <Icon size={17} />
              {option.label}
            </button>
          );
        })}
      </div>

      {precisaObservacao && (
        <label className="field-label">
          Descrição da ocorrência
          <textarea
            className="form-control min-h-24 py-3"
            value={resposta.observacao}
            onChange={(event) => onPatch({ observacao: event.target.value })}
            placeholder="Descreva o motivo da atenção ou não conformidade"
            disabled={disabled}
            required
          />
        </label>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        {medições.map((medicao) => (
          <label key={medicao.chave} className="field-label">
            {medicao.label}
            <div className="flex overflow-hidden rounded-xl border border-cyan-300/15 bg-navy-900/80">
              <input
                className="w-full bg-transparent px-3 py-2 text-sm font-bold text-white outline-none"
                value={resposta.medições?.[medicao.chave] || ''}
                onChange={(event) => onPatch({ medições: { [medicao.chave]: event.target.value } })}
                disabled={disabled}
              />
              {medicao.unidade && <span className="border-l border-cyan-300/10 px-2 py-2 text-xs font-black text-slate-400">{medicao.unidade}</span>}
            </div>
          </label>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-cyan-300/10 bg-navy-900/55 p-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-cyan-400/10 p-2 text-cyan-100">
            <Camera size={18} />
          </span>
          <div>
            <strong className="block text-sm text-white">Foto do item</strong>
            <small className="text-slate-400">{foto.file ? `Anexada: ${foto.file.name}` : 'Opcional, vinculada diretamente a este checklist'}</small>
          </div>
        </div>
        <input
          className="form-control py-3"
          type="file"
          accept="image/*"
          onChange={(event) => onFoto({ file: event.target.files?.[0] || null })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function CampoGrupo({ title, icon, campos = [], children, columns = 'grid' }) {
  if (!campos?.length) return null;
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-cyan-100">
        {icon}
        {title}
      </div>
      <div className={columns === 'single' ? 'grid gap-3' : 'grid gap-3 md:grid-cols-2'}>
        {campos.map(children)}
      </div>
    </div>
  );
}

function CampoInput({ campo, value, onChange, disabled }) {
  const common = {
    className: 'form-control',
    value,
    onChange: (event) => onChange(event.target.value),
    required: campo.obrigatorio,
    disabled
  };

  if (campo.tipo === 'textarea' || campo.tipo === 'assinatura') {
    return (
      <label key={campo.id} className="field-label md:col-span-2">
        {campo.label}
        <textarea {...common} className="form-control min-h-24 py-3" />
      </label>
    );
  }

  return (
    <label key={campo.id} className="field-label">
      {campo.label}
      <input {...common} type={campo.tipo === 'numero' ? 'number' : 'text'} />
    </label>
  );
}
