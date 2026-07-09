import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  ChapterCover,
  ChapterTopicsPage,
  DocumentationToolbar,
  FlowPage,
  IntroPage,
  PracticesPage,
  ReferenceAnalysis,
  ScreenshotCardsPage,
  StepsScreenshotPage,
  VolumeCover,
  VolumeTocPage
} from '../components/documentation/DocumentationComponents.jsx';
import {
  agendaChapter,
  documentationThemes,
  documentationVolumes,
  officialDocumentationReference
} from '../data/documentationTemplate.js';

const assets = {
  cover: '/brand/convento-penha-documentacao.png',
  logo: '/brand/uniao-obracon-logo.png'
};

function renderPage(page, props) {
  if (page.kind === 'intro') return <IntroPage {...props} page={page} />;
  if (page.kind === 'steps-screenshot') return <StepsScreenshotPage {...props} page={page} />;
  if (page.kind === 'screenshot-cards') return <ScreenshotCardsPage {...props} page={page} />;
  if (page.kind === 'flow') return <FlowPage {...props} page={page} />;
  if (page.kind === 'practices') return <PracticesPage {...props} page={page} />;
  if (page.kind === 'chapter-topics') return <ChapterTopicsPage {...props} chapter={page.chapter} volume={page.volume} />;
  return null;
}

export default function DocumentationKit() {
  const previewRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const volume = documentationVolumes[0];
  const theme = documentationThemes[volume.theme];
  const documentPages = useMemo(() => {
    const pages = [
      { kind: 'volume-cover' },
      { kind: 'volume-toc' },
      { kind: 'chapter-cover', chapter: agendaChapter },
      ...agendaChapter.pages
    ];

    volume.chapters.slice(2).forEach((chapter) => {
      pages.push({
        kind: 'chapter-cover',
        chapter: {
          chapterNumber: chapter.number,
          title: chapter.title,
          coverSubtitle: chapter.subtitle || `Procedimentos do Capítulo ${chapter.number} do Volume 01 - Operador.`
        }
      });
      pages.push({ kind: 'chapter-topics', chapter, volume });
    });

    return pages;
  }, [volume]);

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

      pdf.save('SIGEBAP-Volume-01-Operador.pdf');
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
        volumes={documentationVolumes}
      />

      <div className="rounded-3xl border border-blue-200/10 bg-slate-950/60 p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Prévia editorial</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Volume 01 - Operador</h2>
          <p className="mt-1 text-sm font-normal text-slate-300">
            O Capítulo 01 - Primeiros Passos já está pronto no PDF oficial. Esta prévia continua a sequência do livro do Capítulo 02 ao Capítulo 10.
          </p>
        </div>

        <div ref={previewRef} className="documentation-preview flex flex-col items-center gap-8 overflow-x-auto pb-4">
          {documentPages.map((page, index) => {
            const pageNumber = index + 1;
            if (page.kind === 'volume-cover') {
              return <VolumeCover key="volume-cover" assets={assets} theme={theme} volume={volume} />;
            }
            if (page.kind === 'volume-toc') {
              return <VolumeTocPage key="volume-toc" pageNumber={pageNumber} theme={theme} volume={volume} />;
            }
            if (page.kind === 'chapter-cover') {
              return <ChapterCover key={`chapter-cover-${page.chapter.chapterNumber}`} assets={assets} chapter={page.chapter} theme={theme} />;
            }
            return <div key={`${page.kind}-${pageNumber}`}>{renderPage(page, { pageNumber, theme })}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
