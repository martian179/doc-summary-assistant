import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extracts text from a PDF file, preserving paragraph structure.
 *
 * pdf.js returns text as flat, positioned items per page. We reconstruct
 * paragraphs by grouping items whose vertical gap is small (same line /
 * wrapped line) and starting a new paragraph on a larger vertical jump —
 * a cheap heuristic that holds up well for reports, articles, and
 * scanned-then-OCR'd PDFs alike.
 *
 * @param {File} file
 * @param {(progress: { page: number, total: number }) => void} [onProgress]
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
export async function extractPdfText(file, onProgress) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const paragraphs = [];
  let currentParagraph = [];
  let lastY = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || item.str.trim() === "") continue;

      const y = item.transform[5];
      const fontHeight = item.height || 10;

      if (lastY !== null && Math.abs(y - lastY) > fontHeight * 1.6) {
        if (currentParagraph.length) {
          paragraphs.push(currentParagraph.join(" ").replace(/\s+/g, " ").trim());
        }
        currentParagraph = [];
      }

      currentParagraph.push(item.str);
      lastY = y;
    }

    // Page boundaries always break a paragraph.
    if (currentParagraph.length) {
      paragraphs.push(currentParagraph.join(" ").replace(/\s+/g, " ").trim());
      currentParagraph = [];
    }
    lastY = null;

    onProgress?.({ page: pageNum, total: pdf.numPages });
  }

  const text = paragraphs.filter(Boolean).join("\n\n");

  if (!text.trim()) {
    throw new Error(
      "No selectable text found in this PDF. It may be a scanned image — try re-uploading it as an image file to run OCR instead."
    );
  }

  return { text, pageCount: pdf.numPages };
}
