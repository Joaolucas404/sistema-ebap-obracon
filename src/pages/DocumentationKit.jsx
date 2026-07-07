import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ChapterCover,
  DocumentationToolbar,
  FlowPage,
  IntroPage,
  PracticesPage,
  ReferenceAnalysis,
  ScreenshotCardsPage,
  StepsScreenshotPage
} from '../components/documentation/DocumentationComponents.jsx';
import {
  agendaChapter,
  documentationThemes,
  officialDocumentationReference
} from '../data/documentationTemplate.js';

const assets = {
  cover: '/brand/morro-do-moreno.jpg'
};

function renderPage(page, props) {
  if (page.kind === 'intro') return <IntroPage {...props} page={page} />;
  if (page.kind === 'steps-screenshot') return <StepsScreenshotPage {...props} page={page} />;
  if (page.kind === 'screenshot-cards') return <ScreenshotCardsPage {...props} page={page} />;
  if (page.kind === 'flow') return <FlowPage {...props} page={page} />;
  if (page.kind === 'practices') return <PracticesPage {...props} page={page} />;
  return null;
}

export default function DocumentationKit() {
  const previewRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const theme = documentationThemes[agendaChapter.profile];
  const documentPages = useMemo(() => [{ kind: 'chapter-cover' }, ...agendaChapter.pages], []);

  async function exportPdf() {
    if (!previewRef.current || exporting) return;
    setExporting(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageNodes = Array.from(previewRef.current.querySelectorAll('.doc-official-page'));

      for (let index = 0; index < pageNodes.length; index += 1) {
        const canvas = await html2canvas(pageNodes[index], {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: pageNodes[index].scrollWidth,
          windowHeight: pageNodes[index].scrollHeight
        });
        const image = canvas.toDataURL('image/jpeg', 0.96);
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(image, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save('SIGEBAP-Capitulo-02-Agenda-Operacional.pdf');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <DocumentationToolbar
        exporting={exporting}
        onExport={exportPdf}
        reference={officialDocumentationReference}
        theme={theme}
      />

      <ReferenceAnalysis
        reference={officialDocumentationReference}
        themes={documentationThemes}
      />

      <div className="rounded-3xl border border-blue-200/10 bg-slate-950/60 p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Prévia editorial</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Capítulo 02 - Agenda Operacional</h2>
          <p className="mt-1 text-sm font-normal text-slate-300">
            Primeira entrega do template oficial: somente o capítulo solicitado, preservando o padrão visual do PDF de referência.
          </p>
        </div>

        <div ref={previewRef} className="documentation-preview flex flex-col items-center gap-8 overflow-x-auto pb-4">
          {documentPages.map((page, index) => {
            const pageNumber = index + 1;
            if (page.kind === 'chapter-cover') {
              return <ChapterCover key="chapter-cover" assets={assets} chapter={agendaChapter} theme={theme} />;
            }
            return renderPage(page, { key: `${page.kind}-${pageNumber}`, pageNumber, theme });
          })}
        </div>
      </div>
    </div>
  );
}
