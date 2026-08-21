import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ComicProject, ComicPage } from '../types/comic';
import { renderComicPageToCanvas } from './canvasCompositor';

export interface ExportProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Compiles full comic project into a multi-page PDF book
 */
export async function exportProjectToPdf(
  project: ComicProject,
  onProgress?: ExportProgressCallback
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Set Metadata
  pdfDoc.setTitle(project.title || 'Comic Graphic Novel');
  pdfDoc.setAuthor((project.metadata.author as string) || 'MD to Comic Generator');
  pdfDoc.setSubject(project.metadata.genre as string || 'Sequential Art');
  pdfDoc.setCreator('MD to Comic AI Studio');

  const totalPages = project.pages.length;
  const offscreenCanvas = document.createElement('canvas');

  for (let i = 0; i < totalPages; i++) {
    const page = project.pages[i];
    if (onProgress) {
      onProgress(i + 1, totalPages, `Rendering Page ${i + 1} of ${totalPages}...`);
    }

    let pngDataUrl = page.assembled_image_url;
    
    if (!pngDataUrl) {
      // High resolution render fallback (scale 1.5)
      await renderComicPageToCanvas(offscreenCanvas, page, 1.5);
      pngDataUrl = offscreenCanvas.toDataURL('image/png');
    }
    
    const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());

    const embeddedPng = await pdfDoc.embedPng(pngBytes);
    const pdfPage = pdfDoc.addPage([embeddedPng.width * 0.5, embeddedPng.height * 0.5]);

    pdfPage.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: pdfPage.getWidth(),
      height: pdfPage.getHeight()
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Downloads a single page as a high-resolution PNG
 */
export async function downloadPagePng(page: ComicPage, filename?: string) {
  if (page.assembled_image_url) {
    const res = await fetch(page.assembled_image_url);
    const blob = await res.blob();
    saveAs(blob, filename || `comic-page-${page.page_index}.png`);
    return;
  }

  const canvas = document.createElement('canvas');
  await renderComicPageToCanvas(canvas, page, 2.0); // 2x high-res
  
  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, filename || `comic-page-${page.page_index}.png`);
    }
  }, 'image/png');
}

/**
 * Downloads the full project as a multi-page PDF file
 */
export async function downloadComicPdf(
  project: ComicProject,
  onProgress?: ExportProgressCallback
) {
  const pdfBytes = await exportProjectToPdf(project, onProgress);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const safeTitle = (project.title || 'comic-book').toLowerCase().replace(/[^a-z0-9]/g, '-');
  saveAs(blob, `${safeTitle}.pdf`);
}

/**
 * Exports all raw generated panel images & scripts as a ZIP bundle
 */
export async function downloadProjectZip(project: ComicProject) {
  const zip = new JSZip();
  const imgFolder = zip.folder('panels');
  const pagesFolder = zip.folder('pages');

  // Add project metadata JSON
  zip.file('project-data.json', JSON.stringify(project, null, 2));

  // Add raw markdown source
  zip.file('source.md', project.raw_markdown);

  const canvas = document.createElement('canvas');

  // Add assembled pages
  for (const page of project.pages) {
    let pageDataUrl = page.assembled_image_url;
    
    if (!pageDataUrl) {
      await renderComicPageToCanvas(canvas, page, 1.5);
      pageDataUrl = canvas.toDataURL('image/png');
    }
    const pageBase64 = pageDataUrl.split(',')[1];
    pagesFolder?.file(`page-${page.page_index}.png`, pageBase64, { base64: true });

    // Add individual panels
    for (const panel of page.panels) {
      if (panel.image_url) {
        if (panel.image_url.startsWith('data:image')) {
          const b64 = panel.image_url.split(',')[1];
          imgFolder?.file(`page${page.page_index}_panel${panel.panel_index}.png`, b64, { base64: true });
        } else {
          try {
            const res = await fetch(panel.image_url);
            const blob = await res.blob();
            imgFolder?.file(`page${page.page_index}_panel${panel.panel_index}.png`, blob);
          } catch (e) {
            console.warn('Failed to zip panel image:', e);
          }
        }
      }
    }
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const safeTitle = (project.title || 'comic-assets').toLowerCase().replace(/[^a-z0-9]/g, '-');
  saveAs(zipContent, `${safeTitle}-assets.zip`);
}
