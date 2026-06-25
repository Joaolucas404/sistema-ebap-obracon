import { BRAND } from '../../config/brand.js';

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
    concluida_arquivada: 'Concluida / Arquivada'
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

function PhotoGrid({ photos = [] }) {
  if (!photos.length) return <p className="pdf-muted">Nenhuma foto anexada.</p>;
  return (
    <div className="pdf-photos">
      {photos.map((photo) => (
        <figure key={photo.id || photo.url}>
          {photo.url ? <img src={photo.url} alt={photo.legenda || photo.nome_original || 'Foto'} crossOrigin="anonymous" /> : <div />}
          <figcaption>{photo.legenda || photo.nome_original || 'Foto do registro'}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Timeline({ items = [] }) {
  if (!items.length) return <p className="pdf-muted">Nenhum registro encontrado.</p>;
  return (
    <div className="pdf-timeline">
      {items.map((item) => (
        <div key={item.id || `${item.acao}-${item.created_at}`}>
          <div>
            <strong>{item.acao || item.status || 'Registro'}</strong>
            <span>{formatDate(item.created_at || item.validado_em)}</span>
          </div>
          <p>{item.descricao || item.observacoes || item.motivo_devolucao || item.motivo || '-'}</p>
          {(item.status_anterior || item.status_novo) && (
            <small>
              {pretty(item.status_anterior, 'status')} para {pretty(item.status_novo, 'status')}
            </small>
          )}
          {item.usuario?.nome && <small>Responsavel: {item.usuario.nome}</small>}
          {item.operador_cco?.nome && <small>CCO: {item.operador_cco.nome}</small>}
        </div>
      ))}
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
  const title = type === 'ro' ? 'Relatorio Diario do Operador' : 'Ordem de Servico';
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
  return (
    <>
      <Section title="Dados da OS">
        <div className="pdf-meta">
          <Field label="Numero" value={os.numero} />
          <Field label="Status" value={<StatusPill label={pretty(os.status, 'status')} />} />
          <Field label="Prioridade" value={pretty(os.prioridade, 'prioridade')} />
          <Field label="EBAP" value={os.ebap?.nome} />
          <Field label="Area" value={data?.areaLabel || os.area} />
          <Field label="Equipamento com falha" value={os.payload?.equipamento_falha || os.equipamento?.nome} />
          <Field label="Solicitante" value={os.solicitante?.nome} />
          <Field label="Responsavel" value={os.responsavel?.nome} />
          <Field label="Criada em" value={formatDate(os.created_at)} />
        </div>
        <p className="pdf-text">
          <strong>{os.titulo}</strong>
          {'\n'}
          {os.descricao}
        </p>
      </Section>

      <Section title="Historico completo">
        <Timeline items={data?.historico || []} />
      </Section>

      <Section title="Comentarios por etapa">
        <Timeline items={(data?.comentarios || []).map((comentario) => ({ ...comentario, acao: 'comentario', descricao: comentario.comentario }))} />
      </Section>

      <Section title="Relatorio tecnico e aprovacoes">
        {relatorioTecnico && (
          <>
            <div className="pdf-meta">
              <Field label="Modelo" value={relatorioTecnico.modelo?.titulo || relatorioTecnico.ativo_nome} />
              <Field label="Tipo" value={pretty(relatorioTecnico.tipo_manutencao)} />
              <Field label="Status" value={pretty(relatorioTecnico.status)} />
              <Field label="Enviado em" value={formatDate(relatorioTecnico.enviado_em)} />
            </div>
            <div className="pdf-table-wrap">
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(respostas).map(([key, value]) => (
                    <tr key={key}>
                      <td>{pretty(key)}</td>
                      <td>{typeof value === 'boolean' ? (value ? 'OK' : 'Nao') : String(value || '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <p className="pdf-text">Relatorio tecnico: {os.relatorio_tecnico || '-'}</p>
        <p className="pdf-text">Materiais utilizados: {os.materiais_utilizados || '-'}</p>
        <p className="pdf-text">Pendencias: {os.pendencias || '-'}</p>
      </Section>

      <Section title="Fotos e anexos">
        <PhotoGrid photos={data?.fotos || []} />
      </Section>
    </>
  );
}
