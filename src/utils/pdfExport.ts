/**
 * PDF Export — generates an event packet with banners + summary.
 */

import { jsPDF } from 'jspdf';

type PdfBanner = {
  label: string;
  pngDataUrl: string; // data:image/png;base64,...
};

type PdfOptions = {
  eventName: string;
  eventDate: string;
  panelTopic: string;
  panelSubtitle: string;
  panelists: Array<{ name: string; title: string; org: string }>;
  banners: PdfBanner[];
  onProgress?: (current: number, total: number) => void;
};

/**
 * Render an array of HTML strings into PNG data URLs via the server.
 * Falls back to client-side if server is unavailable.
 */
export async function renderBannersToPng(
  htmlStrings: Array<{ html: string; label: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<PdfBanner[]> {
  const results: PdfBanner[] = [];

  // Try batch endpoint first
  try {
    const res = await fetch('/api/render-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlList: htmlStrings.map(h => h.html) }),
    });

    if (res.ok) {
      const data = await res.json();
      for (let i = 0; i < data.images.length; i++) {
        results.push({ label: htmlStrings[i].label, pngDataUrl: `data:image/png;base64,${data.images[i]}` });
        onProgress?.(i + 1, htmlStrings.length);
      }
      return results;
    }
  } catch {
    // Batch endpoint not available, fall back to individual
  }

  // Individual render fallback
  for (let i = 0; i < htmlStrings.length; i++) {
    try {
      const res = await fetch('/api/render-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlStrings[i].html }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        results.push({ label: htmlStrings[i].label, pngDataUrl: dataUrl });
      }
    } catch {
      // Skip failed renders
    }
    onProgress?.(i + 1, htmlStrings.length);
  }

  return results;
}

/**
 * Generate a PDF event packet.
 */
export async function generateEventPdf(options: PdfOptions): Promise<Blob> {
  const { eventName, eventDate, panelTopic, panelSubtitle, panelists, banners, onProgress } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ——— Cover Page ———
  pdf.setFillColor(10, 74, 68); // Dark teal
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setTextColor(221, 232, 33); // Lime
  pdf.setFontSize(12);
  pdf.text('PANEL FLYER STUDIO', pageWidth / 2, 40, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  const titleLines = pdf.splitTextToSize(eventName || panelTopic, contentWidth);
  pdf.text(titleLines, pageWidth / 2, 70, { align: 'center' });

  if (panelSubtitle) {
    pdf.setFontSize(14);
    pdf.setTextColor(200, 240, 160);
    const subtitleLines = pdf.splitTextToSize(panelSubtitle, contentWidth);
    pdf.text(subtitleLines, pageWidth / 2, 70 + titleLines.length * 12 + 10, { align: 'center' });
  }

  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  if (eventDate) pdf.text(eventDate, pageWidth / 2, 130, { align: 'center' });

  // Panelist list
  if (panelists.length > 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(200, 240, 160);
    pdf.text('PANELISTS', pageWidth / 2, 160, { align: 'center' });

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    let y = 172;
    for (const p of panelists) {
      const line = `${p.name}${p.title ? ` — ${p.title}` : ''}${p.org ? `, ${p.org}` : ''}`;
      pdf.text(line, pageWidth / 2, y, { align: 'center' });
      y += 7;
    }
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // ——— Banner Pages ———
  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    onProgress?.(i + 1, banners.length);

    pdf.addPage();

    // Banner label
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, 15, 'F');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(10);
    pdf.text(banner.label, margin, 10);

    // Banner image (scale to fit page width)
    try {
      const imgWidth = contentWidth;
      const imgHeight = contentWidth; // 1:1 aspect ratio
      const x = margin;
      const y = 20;

      if (imgHeight + y > pageHeight - 10) {
        // Scale down if too tall
        const scale = (pageHeight - 30) / imgHeight;
        pdf.addImage(banner.pngDataUrl, 'PNG', x, y, imgWidth * scale, imgHeight * scale);
      } else {
        pdf.addImage(banner.pngDataUrl, 'PNG', x, y, imgWidth, imgHeight);
      }
    } catch {
      pdf.setTextColor(200, 50, 50);
      pdf.text('(Banner image could not be embedded)', margin, 50);
    }
  }

  return pdf.output('blob');
}

/**
 * Trigger PDF download in browser.
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
