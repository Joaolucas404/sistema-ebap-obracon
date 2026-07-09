import { Check, Download, Eye, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card, { CardHeader } from '../ui/Card.jsx';

export function DocumentationToolbar({ onExport, exporting, reference, theme }) {
  return (
    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" padding="md">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Template oficial SIGEBAP</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Volume 01 - Operador</h2>
        <p className="mt-1 text-sm font-normal text-slate-300">
          Baseado no PDF de referência: {reference.source}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={Eye} variant="secondary">Tema {theme.name}</Button>
        <Button icon={Download} loading={exporting} onClick={onExport} variant="primary">
          Exportar PDF
        </Button>
      </div>
    </Card>
  );
}

export function ReferenceAnalysis({ reference, themes, volumes = [] }) {
  return (
    <Card padding="lg">
      <CardHeader
        title="Análise do padrão oficial"
        description="Resumo dos elementos identificados no PDF de referência antes da geração do Capítulo 02."
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-semibold text-white">Medidas base</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <InfoLine label="Formato" value={reference.page.format} />
            <InfoLine label="Página" value={`${reference.page.widthMm} x ${reference.page.heightMm} mm`} />
            <InfoLine label="Margem" value={`${reference.page.marginMm} mm`} />
            <InfoLine label="Rodapé" value={`${reference.page.footerBottomMm} mm`} />
          </dl>
        </div>
        <div className="rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-semibold text-white">Regras visuais</h3>
          <div className="mt-3 grid gap-2 text-sm font-normal text-slate-300 md:grid-cols-2">
            {reference.visualRules.map((rule) => (
              <div key={rule} className="rounded-xl bg-white/[0.04] px-3 py-2">{rule}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {Object.values(themes).map((item) => (
          <span
            key={item.name}
            className="rounded-full border px-3 py-1 text-sm font-semibold"
            style={{ borderColor: item.border, backgroundColor: item.soft, color: item.primary }}
          >
            {item.name}
          </span>
        ))}
      </div>
      {volumes.length > 0 && (
        <div className="mt-5 rounded-2xl border border-blue-200/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-semibold text-white">Coleção planejada</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {volumes.map((volume) => {
              const theme = themes[volume.theme] || themes.operador;
              return (
                <div key={volume.number} className="rounded-xl border px-3 py-2" style={{ borderColor: theme.border, backgroundColor: `${theme.primary}18` }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.primary }}>Volume {volume.number}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{volume.title}</p>
                  <p className="mt-1 text-xs font-normal text-slate-300">{volume.chapters.length} capítulo(s)</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-white">{value}</dd>
    </div>
  );
}

export function ChapterCover({ chapter, theme, assets }) {
  return (
    <section
      className="doc-official-page doc-cover-page text-white"
      style={{
        '--doc-primary': theme.primary,
        '--doc-soft': theme.soft,
        '--doc-border': theme.border,
        backgroundImage: `linear-gradient(180deg, rgba(8, 24, 56, .58) 0%, rgba(8, 24, 56, .82) 52%, rgba(0, 112, 72, .82) 100%), url(${assets.cover})`
      }}
    >
      <div className="absolute left-[13mm] top-[68mm]">
        <p className="text-[15px] font-normal uppercase tracking-[0.02em] text-white">CAPÍTULO</p>
        <div className="mt-[3mm] text-[52px] font-extrabold leading-none tracking-tight">{chapter.chapterNumber}</div>
        <div className="mt-[4mm] h-[3px] w-[31mm]" style={{ backgroundColor: theme.primary }} />
        <h1 className="mt-[10mm] text-[31px] font-extrabold leading-tight tracking-[-0.02em]">{chapter.title}</h1>
        <p className="mt-[2mm] max-w-[150mm] text-[13px] font-normal leading-6 text-white/88">{chapter.coverSubtitle}</p>
      </div>
    </section>
  );
}

export function VolumeCover({ volume, theme, assets }) {
  return (
    <section
      className="doc-official-page doc-cover-page text-white"
      style={{
        '--doc-primary': theme.primary,
        '--doc-soft': theme.soft,
        '--doc-border': theme.border,
        backgroundImage: `linear-gradient(180deg, rgba(8, 24, 56, .54) 0%, rgba(8, 24, 56, .84) 56%, rgba(0, 112, 72, .84) 100%), url(${assets.cover})`
      }}
    >
      <div className="absolute left-[14mm] top-[7mm]">
        <img className="h-[15mm] w-[15mm] object-contain" src={assets.logo} alt="União Obracon" />
      </div>
      <div className="absolute left-[14mm] top-[27mm]">
        <p className="text-[10px] font-normal uppercase tracking-[0.04em] text-white/86">COLEÇÃO OFICIAL DE GUIAS OPERACIONAIS</p>
        <div className="mt-[4mm] h-[1mm] w-[31mm]" style={{ backgroundColor: theme.primary }} />
      </div>
      <div className="absolute left-[14mm] right-[14mm] top-[174mm]">
        <h1 className="text-[41px] font-extrabold leading-none tracking-[0.06em]">SIGEBAP</h1>
        <p className="mt-[3mm] text-[22px] font-normal leading-none text-white">Manual Operacional</p>
        <h2 className="mt-[5mm] text-[32px] font-extrabold leading-none" style={{ color: theme.primary }}>{volume.title}</h2>
        <p className="mt-[4mm] max-w-[142mm] text-[13px] font-normal leading-[1.25] text-white/90">
          Sistema Integrado de Gestão das Estações Elevatórias de Águas Pluviais
        </p>
      </div>
      <div className="absolute left-[14mm] right-[14mm] top-[244mm] rounded-[3mm] border border-white/80 bg-[#06132d]/88 px-[5mm] py-[5mm]">
        <div className="grid grid-cols-[1fr_1px_1fr] gap-[6mm]">
          <div>
            <p className="text-[8px] font-extrabold uppercase tracking-[0.08em]" style={{ color: theme.primary }}>IDEALIZAÇÃO</p>
            <p className="mt-[1mm] text-[10px] font-extrabold text-white">Alex Gomes de Matos Martins</p>
            <p className="mt-[1mm] text-[8px] font-normal text-white/72">Idealizador Operacional</p>
          </div>
          <div className="h-[18mm] bg-white/60" />
          <div>
            <p className="text-[8px] font-extrabold uppercase tracking-[0.08em]" style={{ color: theme.primary }}>DESENVOLVIMENTO</p>
            <p className="mt-[1mm] text-[10px] font-extrabold text-white">João Lucas Soares Almeida</p>
            <p className="mt-[1mm] text-[8px] font-normal text-white/72">Desenvolvedor do SIGEBAP</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[0mm] left-[14mm] right-[14mm] h-[10mm] rounded-t-[2mm] bg-white" />
    </section>
  );
}

export function VolumeTocPage({ volume, theme, pageNumber }) {
  return (
    <OfficialPage header={`VOLUME ${volume.number} - ${volume.title}`} footerLeft={`SIGEBAP - Livro Operacional ${volume.title}`} footerCenter="Índice do volume" pageNumber={pageNumber} theme={theme}>
      <PageTitle
        title={`Volume ${volume.number} - ${volume.title}`}
        subtitle="Estrutura sequencial do livro operacional. Cada capítulo mantém a mesma identidade visual, margens e hierarquia editorial."
      />
      <div className="mt-[16mm] grid grid-cols-2 gap-x-[12mm] gap-y-[5mm]">
        {volume.chapters.map((chapter) => (
          <div key={`${chapter.number}-${chapter.title}`} className="rounded-[4mm] border border-slate-200 bg-white p-[4mm] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-[4mm]">
              <span className="grid h-[9mm] w-[9mm] shrink-0 place-items-center rounded-[2mm] text-[11px] font-extrabold text-white" style={{ backgroundColor: theme.primary }}>
                {chapter.number}
              </span>
              <div>
                <h3 className="text-[13px] font-extrabold leading-tight text-[#0B1224]">{chapter.title}</h3>
                {chapter.subtitle && <p className="mt-[1mm] text-[9px] font-semibold uppercase tracking-[0.04em]" style={{ color: theme.primary }}>{chapter.subtitle}</p>}
                {chapter.status === 'pronto' && <p className="mt-[1mm] text-[9px] font-semibold text-slate-500">Capítulo já produzido</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Callout className="absolute bottom-[24mm] left-0 right-0" title="PADRÃO EDITORIAL" theme={theme}>
        O livro deve ser lido em sequência: capa, índice, capítulos e procedimentos. Capítulos já finalizados são preservados como referência oficial.
      </Callout>
    </OfficialPage>
  );
}

export function ExistingChapterNotice({ chapter, volume, theme, pageNumber }) {
  return (
    <OfficialPage header={`VOLUME ${volume.number} - ${volume.title}`} footerLeft={`SIGEBAP - Livro Operacional ${volume.title}`} footerCenter={`Capítulo ${chapter.number}`} pageNumber={pageNumber} theme={theme}>
      <div className="flex h-full flex-col justify-center">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em]" style={{ color: theme.primary }}>CAPÍTULO {chapter.number}</p>
        <h2 className="mt-[4mm] text-[36px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B1224]">{chapter.title}</h2>
        <div className="mt-[5mm] h-[3px] w-[32mm]" style={{ backgroundColor: theme.primary }} />
        <p className="mt-[10mm] max-w-[138mm] text-[14px] font-normal leading-7 text-slate-600">
          Este capítulo já está finalizado no arquivo oficial informado pelo usuário e será preservado como a primeira parte do Volume {volume.number}.
        </p>
        <div className="mt-[10mm] rounded-[4mm] border p-[6mm]" style={{ borderColor: theme.border, backgroundColor: theme.soft }}>
          <h3 className="text-[12px] font-extrabold uppercase tracking-[0.04em]" style={{ color: theme.primary }}>Arquivo oficial existente</h3>
          <p className="mt-[2mm] text-[12px] font-normal text-[#0B1224]">{chapter.source}</p>
        </div>
      </div>
    </OfficialPage>
  );
}

export function OfficialPage({ children, header, footerLeft, footerCenter, pageNumber, theme }) {
  return (
    <section
      className="doc-official-page bg-white text-[#0B1224]"
      style={{
        '--doc-primary': theme.primary,
        '--doc-soft': theme.soft,
        '--doc-border': theme.border
      }}
    >
      <header className="absolute left-[12mm] right-[12mm] top-[8mm]">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.04em]" style={{ color: theme.primary }}>{header}</div>
        <div className="mt-2 h-px bg-slate-200" />
      </header>
      <main className="absolute left-[12mm] right-[12mm] top-[30mm] bottom-[24mm]">{children}</main>
      <footer className="absolute bottom-[8mm] left-[12mm] right-[12mm] text-[10px] font-normal text-slate-500">
        <div className="mb-2 h-px bg-slate-200" />
        <div className="grid grid-cols-3 items-center">
          <span>{footerLeft}</span>
          <span className="text-center">{footerCenter}</span>
          <span className="text-right">Página {pageNumber}</span>
        </div>
      </footer>
    </section>
  );
}

export function IntroPage({ page, theme, pageNumber }) {
  return (
    <OfficialPage header={page.header} footerLeft={theme.footer} footerCenter="Agenda Operacional" pageNumber={pageNumber} theme={theme}>
      <PageTitle title={page.title} subtitle={page.subtitle} />
      <div className="mt-[22mm] grid grid-cols-2 gap-x-[12mm] gap-y-[14mm]">
        {page.cards.map((card) => <NumberCard key={card.number} item={card} theme={theme} />)}
      </div>
      <Callout className="absolute bottom-[26mm] left-0 right-0" title={page.calloutTitle} theme={theme}>{page.calloutText}</Callout>
    </OfficialPage>
  );
}

export function StepsScreenshotPage({ page, theme, pageNumber }) {
  return (
    <OfficialPage header={page.header} footerLeft={theme.footer} footerCenter="Consultando a agenda" pageNumber={pageNumber} theme={theme}>
      <PageTitle title={page.title} subtitle={page.subtitle} />
      <div className="mt-[18mm] grid grid-cols-[72mm_1fr] items-start gap-[10mm]">
        <div className="space-y-[13mm] pt-[2mm]">
          {page.steps.map((step, index) => <StepItem key={step.title} number={index + 1} title={step.title} text={step.text} theme={theme} />)}
        </div>
        <Figure src={page.screenshot} caption={page.figure} />
      </div>
      <Callout className="absolute bottom-[20mm] left-0 right-0" title={page.calloutTitle} theme={theme}>{page.calloutText}</Callout>
    </OfficialPage>
  );
}

export function ScreenshotCardsPage({ page, theme, pageNumber }) {
  return (
    <OfficialPage header={page.header} footerLeft={theme.footer} footerCenter="Tela da agenda" pageNumber={pageNumber} theme={theme}>
      <PageTitle title={page.title} subtitle={page.subtitle} />
      <div className="mt-[10mm]">
        <Figure src={page.screenshot} caption={page.figure} wide />
      </div>
      <div className="mt-[12mm] grid grid-cols-3 gap-[8mm]">
        {page.cards.map((card) => <NumberCard key={card.number} item={card} compact theme={theme} />)}
      </div>
    </OfficialPage>
  );
}

export function FlowPage({ page, theme, pageNumber }) {
  return (
    <OfficialPage header={page.header} footerLeft={theme.footer} footerCenter="Fluxo operacional" pageNumber={pageNumber} theme={theme}>
      <PageTitle title={page.title} subtitle={page.subtitle} />
      <div className="mx-auto mt-[24mm] w-[86mm] space-y-[5mm]">
        {page.flow.map((item, index) => (
          <div key={item}>
            <div className="flex h-[11mm] items-center rounded-full border px-[3mm]" style={{ borderColor: theme.border }}>
              <span className="mr-[5mm] grid h-[7mm] w-[7mm] place-items-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: theme.primary }}>{index + 1}</span>
              <span className="text-[12px] font-extrabold text-[#0B1224]">{item}</span>
            </div>
            {index < page.flow.length - 1 && <div className="mx-auto h-[7mm] w-[2px]" style={{ backgroundColor: theme.primary }} />}
          </div>
        ))}
      </div>
      <Callout className="absolute bottom-[28mm] left-0 right-0" title={page.calloutTitle} theme={theme}>{page.calloutText}</Callout>
    </OfficialPage>
  );
}

export function PracticesPage({ page, theme, pageNumber }) {
  return (
    <OfficialPage header={page.header} footerLeft={theme.footer} footerCenter="Boas práticas" pageNumber={pageNumber} theme={theme}>
      <PageTitle title={page.title} subtitle={page.subtitle} />
      <div className="mt-[20mm] grid grid-cols-2 gap-[20mm]">
        <PracticeList title="FAÇA SEMPRE" items={page.do} icon={Check} color={theme.primary} />
        <PracticeList title="EVITE" items={page.avoid} icon={X} color="#DC2626" />
      </div>
      <div className="mt-[20mm] rounded-[4mm] border border-slate-200 bg-slate-50/60 p-[7mm]">
        <h3 className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-[#0B1224]">CHECKLIST DE APRENDIZADO</h3>
        <div className="mt-[5mm] space-y-[4mm]">
          {page.checklist.map((item) => (
            <div key={item} className="flex items-center gap-[4mm] text-[12px] font-normal text-[#0B1224]">
              <span className="h-[4mm] w-[4mm] border-2" style={{ borderColor: theme.primary }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </OfficialPage>
  );
}

export function ChapterTopicsPage({ chapter, volume, theme, pageNumber }) {
  return (
    <OfficialPage
      header={`VOLUME ${volume.number} - ${volume.title}`}
      footerLeft={`SIGEBAP - Livro Operacional ${volume.title}`}
      footerCenter={`Capítulo ${chapter.number}`}
      pageNumber={pageNumber}
      theme={theme}
    >
      <PageTitle
        title={`${chapter.number}. ${chapter.title}`}
        subtitle={chapter.subtitle || 'Orientações operacionais para uso correto do SIGEBAP durante a rotina de campo.'}
      />
      <div className="mt-[14mm] grid grid-cols-2 gap-x-[10mm] gap-y-[6mm]">
        {chapter.topics.map((topic, index) => (
          <div
            key={topic}
            className="rounded-[4mm] border bg-white p-[5mm] shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-start gap-[4mm]">
              <span className="grid h-[8mm] w-[8mm] shrink-0 place-items-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: theme.primary }}>
                {index + 1}
              </span>
              <div>
                <h3 className="text-[13px] font-extrabold leading-tight text-[#0B1224]">{topic}</h3>
                <p className="mt-[2mm] text-[10px] font-normal leading-[1.35] text-slate-500">
                  Procedimento documentado para consulta, preenchimento ou acompanhamento dentro do módulo.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Callout className="absolute bottom-[23mm] left-0 right-0" title="OBJETIVO DO CAPÍTULO" theme={theme}>
        Padronizar a execução do operador e reduzir dúvidas durante o uso diário do SIGEBAP.
      </Callout>
    </OfficialPage>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B1224]">{title}</h2>
      <p className="mt-[1mm] text-[14px] font-normal leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

function NumberCard({ item, theme, compact = false }) {
  return (
    <div
      className={`rounded-[4mm] border bg-white/80 ${compact ? 'min-h-[24mm] p-[5mm]' : 'min-h-[32mm] p-[6mm]'} shadow-[0_12px_35px_rgba(15,23,42,0.05)]`}
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-start gap-[5mm]">
        <span className="grid h-[10mm] w-[10mm] shrink-0 place-items-center rounded-[2mm] text-[12px] font-extrabold" style={{ backgroundColor: theme.soft, color: theme.primary }}>
          {item.number}
        </span>
        <div>
          <h3 className="text-[15px] font-extrabold leading-tight text-[#0B1224]">{item.title}</h3>
          <p className="mt-[2mm] text-[11px] font-normal leading-[1.25] text-slate-500">{item.text}</p>
        </div>
      </div>
    </div>
  );
}

function StepItem({ number, title, text, theme }) {
  return (
    <div className="flex items-start gap-[5mm]">
      <span className="grid h-[10mm] w-[10mm] shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white" style={{ backgroundColor: theme.primary }}>
        {number}
      </span>
      <div>
        <h3 className="text-[13px] font-extrabold leading-tight text-[#0B1224]">{title}</h3>
        <p className="mt-[1mm] text-[10px] font-normal leading-[1.22] text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function Figure({ src, caption, wide = false }) {
  return (
    <figure className="m-0">
      <div className={`overflow-hidden rounded-[4mm] border border-slate-200 bg-white p-[2mm] shadow-[0_12px_24px_rgba(15,23,42,0.16)] ${wide ? 'w-full' : ''}`}>
        <img className="block h-auto w-full rounded-[2mm]" src={src} alt={caption} />
      </div>
      <figcaption className="mt-[4mm] text-center text-[10px] font-normal text-slate-500">{caption}</figcaption>
    </figure>
  );
}

function Callout({ title, children, theme, className = '' }) {
  return (
    <div className={`rounded-[4mm] border p-[6mm] ${className}`} style={{ borderColor: theme.primary, backgroundColor: theme.soft }}>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.04em]" style={{ color: theme.primary }}>{title}</h3>
      <p className="mt-[3mm] text-[12px] font-normal leading-6 text-[#0B1224]">{children}</p>
    </div>
  );
}

function PracticeList({ title, items, icon: Icon, color }) {
  return (
    <div>
      <h3 className="text-[16px] font-extrabold uppercase tracking-[0.03em]" style={{ color }}>{title}</h3>
      <div className="mt-[8mm] space-y-[11mm]">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-[4mm]">
            <span className="grid h-[8mm] w-[8mm] place-items-center rounded-full text-white" style={{ backgroundColor: color }}>
              <Icon size={14} strokeWidth={3} />
            </span>
            <span className="text-[13px] font-normal leading-5 text-[#0B1224]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
