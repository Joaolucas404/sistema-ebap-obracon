import { ClipboardCheck, ImagePlus, Wrench } from 'lucide-react';

function groupCampos(campos = []) {
  return campos.reduce((acc, campo) => {
    const grupo = campo.grupo || 'dados';
    acc[grupo] = acc[grupo] || [];
    acc[grupo].push(campo);
    return acc;
  }, {});
}

export default function RelatorioTecnicoDinamico({
  modelos,
  value,
  onChange,
  disabled = false
}) {
  const selectedModelo = modelos.find((modelo) => modelo.id === value.modelo_id) || modelos[0];
  const grupos = groupCampos(selectedModelo?.campos || []);

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
        Nenhum modelo técnico dinâmico encontrado para esta OS. O relatório textual continua disponível.
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
          <h3 className="text-lg font-black text-white">Modelo técnico dinâmico</h3>
          <p className="text-sm text-slate-300">
            Campos, checklist e fotos obrigatórias carregados da biblioteca de referência dos HTMLs.
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

      <CampoGrupo title="Dados e medições" icon={<ClipboardCheck size={18} />} campos={grupos.dados}>
        {(campo) => (
          <CampoInput
            campo={campo}
            value={(value.respostas || {})[campo.chave] || ''}
            onChange={(nextValue) => setResposta(campo.chave, nextValue)}
            disabled={disabled}
          />
        )}
      </CampoGrupo>

      <CampoGrupo title="Checklist técnico" icon={<ClipboardCheck size={18} />} campos={grupos.checklist}>
        {(campo) => (
          <label key={campo.id} className="flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-navy-950/55 p-3 text-sm font-bold text-slate-200">
            <input
              className="mt-1"
              type="checkbox"
              checked={Boolean((value.respostas || {})[campo.chave])}
              onChange={(event) => setResposta(campo.chave, event.target.checked)}
              disabled={disabled}
              required={campo.obrigatorio}
            />
            <span>{campo.label}</span>
          </label>
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

      <CampoGrupo title="Finalização" icon={<ClipboardCheck size={18} />} campos={grupos.finalizacao}>
        {(campo) => (
          <CampoInput
            campo={campo}
            value={(value.respostas || {})[campo.chave] || ''}
            onChange={(nextValue) => setResposta(campo.chave, nextValue)}
            disabled={disabled}
          />
        )}
      </CampoGrupo>
    </section>
  );
}

function CampoGrupo({ title, icon, campos = [], children }) {
  if (!campos?.length) return null;
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-cyan-100">
        {icon}
        {title}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
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
