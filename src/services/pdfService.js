import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase.js';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_X_MM = 10;
const PDF_MARGIN_TOP_MM = 8;
const PDF_MARGIN_BOTTOM_MM = 18;
const PDF_FOOTER_Y_MM = 288;

export function gerarNumeroDocumento(prefix) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = String(now.getTime()).slice(-7);
  return `${prefix}-${y}${m}${d}-${suffix}`;
}

export async function gerarQrCodeDocumento({ documentNumber, entityType, entityId }) {
  const url = `${window.location.origin}/arquivo-relatorios?doc=${encodeURIComponent(documentNumber)}&tipo=${entityType}&id=${entityId}`;
  return QRCode.toDataURL(url, { width: 180, margin: 1, errorCorrectionLevel: 'M' });
}

export async function gerarPdfDeElemento(element, { title = 'documento' } = {}) {
  if (!element) throw new Error('Template PDF nao encontrado.');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = A4_WIDTH_MM - PDF_MARGIN_X_MM * 2;
  const usableHeight = A4_HEIGHT_MM - PDF_MARGIN_TOP_MM - PDF_MARGIN_BOTTOM_MM;
  const pageHeightPx = Math.floor((canvas.width * usableHeight) / imgWidth);
  let pageIndex = 0;

  for (let rendered = 0; rendered < canvas.height; rendered += pageHeightPx) {
    if (pageIndex > 0) pdf.addPage();

    const sliceHeight = Math.min(pageHeightPx, canvas.height - rendered);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const context = pageCanvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(canvas, 0, rendered, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    const imgHeight = (sliceHeight * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', PDF_MARGIN_X_MM, PDF_MARGIN_TOP_MM, imgWidth, imgHeight);
    pageIndex += 1;
  }

  const pageCount = pdf.getNumberOfPages();
  const emitted = new Date().toLocaleString('pt-BR');
  for (let index = 1; index <= pageCount; index += 1) {
    pdf.setPage(index);
    pdf.setFontSize(8);
    pdf.setTextColor(80, 90, 110);
    pdf.setDrawColor(220, 228, 240);
    pdf.line(PDF_MARGIN_X_MM, PDF_FOOTER_Y_MM - 5, A4_WIDTH_MM - PDF_MARGIN_X_MM, PDF_FOOTER_Y_MM - 5);
    pdf.text(`${title} - Emitido em ${emitted}`, PDF_MARGIN_X_MM, PDF_FOOTER_Y_MM);
    pdf.text(`Pagina ${index} de ${pageCount}`, A4_WIDTH_MM - PDF_MARGIN_X_MM - 24, PDF_FOOTER_Y_MM);
  }

  return pdf.output('blob');
}

export async function salvarPdfArquivo({ blob, documentNumber, entityType, entityId, title, userId }) {
  const safeName = `${documentNumber}.pdf`.replace(/[^\w.-]+/g, '-');
  const path = `${entityType}/${entityId}/${safeName}`;

  const { error: uploadError } = await supabase.storage.from('pdf-archive').upload(path, blob, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: true
  });
  if (uploadError) throw new Error(uploadError.message);

  const metadata = {
    entidade_tipo: entityType,
    entidade_id: entityId,
    codigo: documentNumber,
    titulo: title,
    bucket: 'pdf-archive',
    path,
    gerado_por: userId || null
  };

  const archiveResult = await supabase
    .from('archive_documents')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      document_number: documentNumber,
      title,
      bucket: 'pdf-archive',
      path,
      generated_by: userId || null,
      payload: {}
    })
    .select()
    .single();

  if (!archiveResult.error) return { ...archiveResult.data, bucket: 'pdf-archive', path };

  const now = new Date();
  const fallback = await supabase
    .from('arquivo_pdf')
    .insert({
      ...metadata,
      data_documento: now.toISOString().slice(0, 10),
      mes: now.getMonth() + 1,
      ano: now.getFullYear()
    })
    .select()
    .single();

  if (fallback.error) throw new Error(`${archiveResult.error.message} ${fallback.error.message}`);
  return fallback.data;
}

export async function baixarBlobComoArquivo(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
