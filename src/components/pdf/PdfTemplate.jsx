import { BRAND } from '../../config/brand.js';
import { equipeTecnicaLabel } from '../../services/usuariosService.js';

const labelMaps = {
  turno: {
    '06-18': 'Dia - 06:00 as 18:00',
    '18-06': 'Noite - 18:00 as 06:00',
    diurno: 'Dia - 06:00 as 18:00',
    noturno: 'Noite - 18:00 as 06:00'
  },
  status: {
    rascunho: 'Rascunho',
    pendente_validacao_cco: 'Pendente validacao CCO',
    validado_cco: 'Validado CCO',
    rejeitado_cco: 'Rejeitado CCO',
    correcao_solicitada: 'Correcao solicitada',
    solicitada_prefeitura: 'Solicitada pela Prefeitura',
    aguardando_supervisor: 'Aguardando Supervisor',
    analise_supervisor: 'Em analise do Supervisor',
    programada: 'Programada',
    encaminhada_tecnicos: 'Encaminhada para Tecnicos',
    em_execucao: 'Em execucao',
    concluida_tecnicos: 'Concluida pelos Tecnicos',
    validacao_supervisor: 'Em validacao do Supervisor',
    enviada_prefeitura: 'Enviada para Prefeitura',
    aguardando_validacao_prefeitura: 'Aguardando validacao da Prefeitura',
    nao_conforme: 'Nao conforme',
    concluida_arquivada: 'Concluida / Arquivada',
    operando: 'Operando',
    atencao: 'Atenção',
    parado: 'Parado',
    em_manutencao: 'Em Manutenção'
  },
  prioridade: {
    baixa: 'Baixa',
    media: 'Media',
    alta: 'Alta',
    critica: 'Critica'
  }
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
}

function pretty(value, mapName) {
  if (!value) return '-';
  return labelMaps[mapName]?.[value] || String(value).replaceAll('_', ' ');
}

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function osTimelineEvent(item) {
  const key = String(item.acao || item.status_novo || item.status || '').toLowerCase();
  const map = {
    criada: ['📄', 'OS Criada'],
    create: ['📄', 'OS Criada'],
    atualizada: ['📄', 'OS Atualizada'],
    review: ['👨‍💼', 'Análise do Supervisor'],
    analise_supervisor: ['👨‍💼', 'Análise do Supervisor'],
    assign: ['👷', 'Encaminhada aos Técnicos'],
    encaminhada_tecnicos: ['👷', 'Encaminhada aos Técnicos'],
    programada: ['👷', 'Encaminhada aos Técnicos'],
    start: ['🔧', 'Início da Execução'],
    em_execucao: ['🔧', 'Início da Execução'],
    execucao_registrada: ['🔧', 'Execução Registrada'],
    finish: ['✅', 'Serviço Concluído'],
    execucao_concluida: ['✅', 'Serviço Concluído'],
    concluida_tecnicos: ['✅', 'Serviço Concluído'],
    encerrada: ['✅', 'Serviço Concluído'],
    validate: ['✔️', 'Validação do Supervisor'],
    validacao_supervisor: ['✔️', 'Validação do Supervisor'],
    send: ['📤', 'Enviada para Aprovação'],
    enviada_prefeitura: ['📤', 'Enviada para Aprovação'],
    comentario: ['💬', 'Comentário'],
    anexo: ['📷', 'Evidência Fotográfica'],
    approve: ['✔️', 'Aprovação Registrada'],
    aprovada: ['✔️', 'Aprovação Registrada'],
    reject: ['⚠️', 'Não Conformidade'],
    return: ['⚠️', 'Correção Solicitada'],
    nao_conforme: ['⚠️', 'Não Conformidade']
  };
  const found = map[key] || map[key.replaceAll('_', '')] || ['•', pretty(key)];
  return { icon: found[0], label: found[1] };
}

function osTeamLabel(os) {
  return equipeTecnicaLabel(os.equipe_responsavel || os.equipe || os.payload?.equipe_executora);
}

function osParticipantes(data) {
  const os = data?.os || {};
  const selectedIds = Array.isArray(os.payload?.tecnicos_participantes_ultima_execucao) ? os.payload.tecnicos_participantes_ultima_execucao : [];
  const equipe = data?.tecnicosEquipe || [];
  const selected = selectedIds.length ? equipe.filter((tecnico) => selectedIds.includes(tecnico.id)) : equipe;
  if (selected.length) return selected.map((tecnico) => tecnico.nome);
  if (os.responsavel?.nome) return [os.responsavel.nome];
  return [];
}

function osFinalEquipmentStatus(os) {
  return os.payload?.impacto_equipamento || os.payload?.workflow?.status_ativo_final || os.status_ativo_final || os.ativo?.status_operacional || '-';
}

function photoStage(photo) {
  const text = String((photo.categoria || '') + ' ' + (photo.legenda || '') + ' ' + (photo.nome_original || '')).toLowerCase();
  if (text.includes('antes')) return 'antes';
  if (text.includes('depois') || text.includes('final')) return 'depois';
  return 'durante';
}

function groupedOsPhotos(photos = []) {
  return {
    antes: photos.filter((photo) => photoStage(photo) === 'antes'),
    durante: photos.filter((photo) => photoStage(photo) === 'durante'),
    depois: photos.filter((photo) => photoStage(photo) === 'depois')
  };
}

function Field({ label, value, wide = false }) {
  return (
    <div className={wide ? 'pdf-field pdf-field-wide' : 'pdf-field'}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="pdf-section">
      <h2>{title}</h2>
      <div className="pdf-section-body">{children}</div>
    </section>
  );
}

function StatusPill({ label }) {
  return <span className="pdf-pill">{label || '-'}</span>;
}

function PhotoGrid({ photos = [], large = false }) {
  if (!photos.length) return <p className="pdf-muted">Nenhuma foto anexada.</p>;
  return (
    <div className={large ? 'pdf-photos pdf-photos-large' : 'pdf-photos'}>
      {photos.map((photo) => (
        <figure key={photo.id || photo.url}>
          {photo.url ? <img src={photo.url} alt={photo.legenda || photo.nome_original || 'Foto'} crossOrigin="anonymous" /> : <div />}
          <figcaption>{photo.legenda || photo.nome_original || 'Foto do registro'}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Timeline({ items = [], variant = 'default' }) {
  if (!items.length) return <p className="pdf-muted">Nenhum registro encontrado.</p>;
  return (
    <div className={variant === 'os' ? 'pdf-os-timeline' : 'pdf-timeline'}>
      {items.map((item) => {
        const event = variant === 'os' ? osTimelineEvent(item) : null;
        return (
          <div key={item.id || String(item.acao || item.status || item.created_at)}>
            <div>
              <strong>{event ? event.icon + ' ' + event.label : item.acao || item.status || 'Registro'}</strong>
              <span>{formatTime(item.created_at || item.validado_em)}</span>
            </div>
            <p>{item.descricao || item.observacoes || item.motivo_devolucao || item.motivo || '-'}</p>
            {(item.status_anterior || item.status_novo) && <small>{pretty(item.status_anterior, 'status')} para {pretty(item.status_novo, 'status')}</small>}
            {item.usuario?.nome && <small>Responsável: {item.usuario.nome}</small>}
            {item.operador_cco?.nome && <small>CCO: {item.operador_cco.nome}</small>}
          </div>
        );
      })}
    </div>
  );
}

function Checklist({ payload = {} }) {
  const sections = [
    ['operacao', 'Operacao'],
    ['bombas', 'Bombas'],
    ['rastelos', 'Rastelos'],
    ['comportas', 'Comportas'],
    ['eletrocentro', 'Eletrocentro'],
    ['geradores', 'Geradores']
  ];

  return (
    <div className="pdf-checklist">
      {sections.map(([section, label]) => {
        const items = payload?.[section]?.items || [];
        return (
          <div key={section} className="pdf-checklist-group">
            <h3>{label}</h3>
            {items.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Observacao</th>
                    <th>OS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.equipamento_id || item.local_id || `${section}-${index}`}>
                      <td>{item.nome || item.descricao || '-'}</td>
                      <td>{pretty(item.status)}</td>
                      <td>{item.observacao || '-'}</td>
                      <td>{item.solicitar_os ? 'Sim' : 'Nao'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="pdf-muted">Sem itens registrados.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PdfStyles() {
  return (
    <style>
      {`
        .pdf-template {
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
          padding: 30px;
          box-sizing: border-box;
        }
        .pdf-cover {
          border: 1px solid #d8e3f2;
          border-radius: 18px;
          overflow: hidden;
          background: #ffffff;
        }
        .pdf-header {
          display: grid;
          grid-template-columns: 92px 1fr 118px;
          gap: 18px;
          align-items: center;
          padding: 22px;
          background: linear-gradient(135deg, #0B2D6B 0%, #123D8A 74%, #0B2D6B 100%);
          color: #ffffff;
        }
        .pdf-header img.logo {
          width: 82px;
          height: 82px;
          object-fit: contain;
          border-radius: 18px;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 10px 20px rgba(0,0,0,0.18);
        }
        .pdf-kicker {
          margin: 0 0 6px;
          color: #91f3a5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }
        .pdf-header h1 {
          margin: 0;
          font-size: 23px;
          line-height: 1.15;
          text-transform: uppercase;
        }
        .pdf-header p {
          margin: 4px 0 0;
          color: #dbeafe;
          font-size: 11px;
          line-height: 1.35;
        }
        .pdf-qr {
          border-radius: 14px;
          background: #ffffff;
          color: #0B2D6B;
          padding: 8px;
          text-align: center;
          font-size: 8px;
          font-weight: 700;
        }
        .pdf-qr img {
          width: 76px;
          height: 76px;
          display: block;
          margin: 0 auto 4px;
        }
        .pdf-body {
          padding: 18px 22px 24px;
        }
        .pdf-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .pdf-field {
          min-height: 42px;
          border: 1px solid #dde7f3;
          border-radius: 10px;
          padding: 8px 10px;
          background: #f8fbff;
          box-sizing: border-box;
        }
        .pdf-field-wide {
          grid-column: span 2;
        }
        .pdf-field span {
          display: block;
          color: #607088;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .pdf-field strong {
          display: block;
          margin-top: 4px;
          color: #111827;
          font-size: 11px;
          line-height: 1.32;
          word-break: break-word;
        }
        .pdf-pill {
          display: inline-block;
          border-radius: 999px;
          background: #eaf7ee;
          color: #0f7a2b;
          padding: 4px 8px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .pdf-section {
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .pdf-section h2 {
          margin: 0;
          border-radius: 10px 10px 0 0;
          background: #0B2D6B;
          color: #ffffff;
          padding: 8px 11px;
          font-size: 12px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .pdf-section-body {
          border: 1px solid #dde7f3;
          border-top: 0;
          border-radius: 0 0 10px 10px;
          padding: 10px;
          background: #ffffff;
        }
        .pdf-section h3 {
          margin: 10px 0 6px;
          color: #123D8A;
          font-size: 11px;
          text-transform: uppercase;
        }
        .pdf-muted {
          color: #64748b;
          font-size: 10px;
          margin: 4px 0;
        }
        .pdf-text {
          white-space: pre-wrap;
          line-height: 1.45;
          font-size: 11px;
          margin: 6px 0;
        }
        .pdf-checklist-group:first-child h3 {
          margin-top: 0;
        }
        .pdf-checklist table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 9px;
          margin-bottom: 6px;
          overflow: hidden;
          border: 1px solid #dbe4f0;
          border-radius: 8px;
        }
        .pdf-checklist th {
          background: #eaf2ff;
          color: #0B2D6B;
          text-align: left;
          padding: 6px;
          font-size: 8px;
          text-transform: uppercase;
        }
        .pdf-checklist td {
          border-top: 1px solid #e5edf7;
          padding: 6px;
          vertical-align: top;
          line-height: 1.28;
        }
        .pdf-checklist tbody tr:nth-child(even) td {
          background: #f8fbff;
        }
        .pdf-timeline {
          display: grid;
          gap: 7px;
        }
        .pdf-timeline > div {
          border: 1px solid #dbe4f0;
          border-left: 4px solid #17B33A;
          border-radius: 9px;
          padding: 8px;
          background: #fbfdff;
        }
        .pdf-timeline > div > div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .pdf-timeline strong {
          color: #0B2D6B;
          font-size: 10px;
          text-transform: uppercase;
        }
        .pdf-timeline span {
          color: #64748b;
          font-size: 9px;
          white-space: nowrap;
        }
        .pdf-timeline p {
          margin: 5px 0 2px;
          color: #172033;
          font-size: 10px;
          line-height: 1.35;
        }
        .pdf-timeline small {
          display: block;
          color: #475569;
          font-size: 9px;
          margin-top: 2px;
        }
        .pdf-photos {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .pdf-photos figure {
          margin: 0;
          border: 1px solid #dbe4f0;
          border-radius: 10px;
          overflow: hidden;
          background: #f8fafc;
        }
        .pdf-photos img,
        .pdf-photos figure > div {
          width: 100%;
          height: 108px;
          object-fit: cover;
          display: block;
          background: #e2e8f0;
        }
        .pdf-photos figcaption {
          min-height: 22px;
          padding: 5px 6px;
          font-size: 8px;
          color: #475569;
          line-height: 1.25;
        }
        .pdf-photos-large {
          grid-template-columns: repeat(2, 1fr);
        }
        .pdf-photos-large img,
        .pdf-photos-large figure > div {
          height: 188px;
        }
        .pdf-technical-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .pdf-tech-card {
          border: 1px solid #dbe4f0;
          border-radius: 10px;
          background: #f8fbff;
          padding: 9px;
        }
        .pdf-tech-card strong {
          color: #0B2D6B;
          font-size: 9px;
          text-transform: uppercase;
        }
        .pdf-tech-card p {
          margin: 5px 0 0;
          color: #172033;
          font-size: 10px;
          line-height: 1.35;
          white-space: pre-wrap;
        }
        .pdf-os-timeline {
          display: grid;
          gap: 7px;
        }
        .pdf-os-timeline > div {
          border: 1px solid #dbe4f0;
          border-left: 4px solid #0B2D6B;
          border-radius: 9px;
          padding: 8px;
          background: #fbfdff;
        }
        .pdf-os-timeline > div > div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .pdf-os-timeline strong {
          color: #0B2D6B;
          font-size: 10px;
        }
        .pdf-os-timeline span,
        .pdf-os-timeline small {
          color: #64748b;
          font-size: 9px;
        }
        .pdf-os-timeline p {
          margin: 5px 0 2px;
          color: #172033;
          font-size: 10px;
          line-height: 1.35;
        }
        .pdf-participants {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        .pdf-participants span {
          border: 1px solid #dbe4f0;
          border-radius: 999px;
          background: #f8fbff;
          padding: 6px 9px;
          color: #172033;
          font-size: 10px;
          font-weight: 700;
        }
        .pdf-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 28px;
        }
        .pdf-signatures div {
          border-top: 1px solid #94a3b8;
          text-align: center;
          padding-top: 6px;
          font-size: 9px;
          color: #334155;
        }
      `}
    </style>
  );
}

export default function PdfTemplate({ type, documentNumber, emittedAt, qrCode, data }) {
  const title = type === 'ro' ? 'RDO - Relatorio Diario Operacional' : 'Ordem de Servico';
  const originCode = data?.codigo || data?.numero || data?.relatorio?.codigo || data?.os?.numero;

  return (
    <div className="pdf-template">
      <PdfStyles />
      <div className="pdf-cover">
        <header className="pdf-header">
          <img className="logo" src={BRAND.institutionalLogo || BRAND.loginLogo} alt={BRAND.consortiumName} />
          <div>
            <p className="pdf-kicker">{BRAND.consortiumName}</p>
            <h1>{title}</h1>
            <p>{BRAND.systemName}</p>
            <p>Documento corporativo para rastreabilidade operacional das EBAPs.</p>
          </div>
          <div className="pdf-qr">
            {qrCode && <img src={qrCode} alt="QR Code" />}
            <div>Consulta digital</div>
            <div>{documentNumber}</div>
          </div>
        </header>

        <main className="pdf-body">
          <div className="pdf-meta">
            <Field label="Documento" value={documentNumber} />
            <Field label="Emissao" value={formatDate(emittedAt)} />
            <Field label="Codigo de origem" value={originCode} />
          </div>

          {type === 'ro' ? <RoDocument data={data} /> : <OsDocument data={data} />}

          <div className="pdf-signatures">
            <div>Responsavel pela emissao</div>
            <div>Validacao / Supervisao</div>
            <div>Arquivo / Consulta</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RoDocument({ data }) {
  const relatorio = data?.relatorio || {};
  const payload = relatorio.payload || data?.payload || {};
  const validacoes = data?.validacoes || [];

  return (
    <>
      <Section title="Dados da EBAP">
        <div className="pdf-meta">
          <Field label="EBAP" value={relatorio.ebap?.nome} />
          <Field label="Operador" value={relatorio.operador?.nome} />
          <Field label="Data da operacao" value={relatorio.data_operacao} />
          <Field label="Status" value={<StatusPill label={pretty(relatorio.status, 'status')} />} />
          <Field label="Turno" value={pretty(payload?.dados?.turno, 'turno')} />
          <Field label="Clima / Nivel" value={`${pretty(payload?.dados?.clima)} / ${pretty(payload?.dados?.nivel_geral)}`} />
        </div>
        <p className="pdf-text">{payload?.dados?.observacao || 'Sem observacao geral.'}</p>
      </Section>

      <Section title="Checklist operacional">
        <Checklist payload={payload} />
      </Section>

      <Section title="Comunicacao CCO e ocorrencias">
        <p className="pdf-text">Comunicacao: {pretty(payload?.cco?.comunicacao)}</p>
        <p className="pdf-text">Supervisao: {pretty(payload?.cco?.supervisao)}</p>
        <p className="pdf-text">Alarmes: {pretty(payload?.cco?.alarmes)}</p>
        <p className="pdf-text">Ocorrencias: {payload?.ocorrencias?.descricao || '-'}</p>
        <p className="pdf-text">Conclusao: {payload?.ocorrencias?.conclusao || relatorio.conclusao_operador || '-'}</p>
      </Section>

      <Section title="Validacao CCO">
        <Timeline items={validacoes} />
      </Section>

      <Section title="Fotos">
        <PhotoGrid photos={data?.fotos || []} />
      </Section>
    </>
  );
}

function OsDocument({ data }) {
  const os = data?.os || {};
  const relatorioTecnico = data?.relatorioTecnico;
  const respostas = relatorioTecnico?.respostas || {};
  const fotos = groupedOsPhotos(data?.fotos || []);
  const tecnico = {
    diagnostico: respostas.diagnostico || respostas['diagnóstico'] || respostas.descricao_falha || os.payload?.equipamento_falha || os.descricao,
    servico: respostas.servico_executado || respostas['serviço_executado'] || respostas.execucao || os.relatorio_tecnico,
    materiais: respostas.materiais_utilizados || os.materiais_utilizados,
    pendencias: respostas.pendencias || os.pendencias,
    statusFinal: pretty(osFinalEquipmentStatus(os), 'status')
  };

  return (
    <>
      <Section title="Resumo executivo da OS">
        <h3 className="pdf-executive-title">Relatório Técnico Operacional</h3>
        <div className="pdf-meta">
          <Field label="OS" value={os.numero} />
          <Field label="EBAP" value={os.ebap?.nome} />
          <Field label="Área" value={data?.areaLabel || os.area} />
          <Field label="Prioridade" value={pretty(os.prioridade, 'prioridade')} />
          <Field label="Equipamento" value={os.ativo?.nome_operacional || os.payload?.equipamento_falha || os.equipamento?.nome} />
          <Field label="Solicitante" value={os.solicitante?.nome} />
          <Field label="Equipe Executora" value={osTeamLabel(os)} />
          <Field label="Abertura" value={formatDate(os.created_at)} />
          <Field label="Conclusão" value={formatDate(os.fim_execucao)} />
          <Field label="Status atual" value={<StatusPill label={pretty(os.status, 'status')} />} />
          <Field label="Tipo" value={pretty(os.tipo_manutencao)} />
          <Field label="Status final do equipamento" value={tecnico.statusFinal} />
        </div>
        <p className="pdf-text"><strong>{os.titulo}</strong>{'\n'}{os.descricao}</p>
      </Section>

      <Section title="Relatório técnico operacional">
        {relatorioTecnico && (
          <div className="pdf-meta">
            <Field label="Modelo" value={relatorioTecnico.modelo?.titulo || relatorioTecnico.ativo_nome} />
            <Field label="Tipo" value={pretty(relatorioTecnico.tipo_manutencao)} />
            <Field label="Situação" value={pretty(relatorioTecnico.status)} />
          </div>
        )}
        <div className="pdf-technical-grid">
          <div className="pdf-tech-card"><strong>Diagnóstico</strong><p>{tecnico.diagnostico || '-'}</p></div>
          <div className="pdf-tech-card"><strong>Serviço executado</strong><p>{tecnico.servico || '-'}</p></div>
          <div className="pdf-tech-card"><strong>Materiais utilizados</strong><p>{tecnico.materiais || '-'}</p></div>
          <div className="pdf-tech-card"><strong>Pendências</strong><p>{tecnico.pendencias || '-'}</p></div>
          <div className="pdf-tech-card"><strong>Status final do equipamento</strong><p>{tecnico.statusFinal || '-'}</p></div>
        </div>
      </Section>

      <Section title="Técnicos participantes">
        <div className="pdf-participants">
          {osParticipantes(data).length ? osParticipantes(data).map((nome) => <span key={nome}>{nome}</span>) : <p className="pdf-muted">Nenhum técnico participante informado.</p>}
        </div>
      </Section>

      <Section title="Linha do tempo operacional">
        <Timeline items={data?.historico || []} variant="os" />
      </Section>

      <Section title="Comentários e observações">
        <Timeline items={(data?.comentarios || []).map((comentario) => ({ ...comentario, acao: 'comentario', descricao: comentario.comentario }))} variant="os" />
      </Section>

      <Section title="Evidências fotográficas - Antes">
        <PhotoGrid photos={fotos.antes} large />
      </Section>
      <Section title="Evidências fotográficas - Durante">
        <PhotoGrid photos={fotos.durante} large />
      </Section>
      <Section title="Evidências fotográficas - Depois">
        <PhotoGrid photos={fotos.depois} large />
      </Section>
    </>
  );
}
