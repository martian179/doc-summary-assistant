import { createWorker } from "tesseract.js";

/**
 * Runs OCR on an image file entirely in the browser (WASM Tesseract).
 *
 * @param {File} file
 * @param {(progress: { status: string, progress: number }) => void} [onProgress]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function extractImageText(file, onProgress) {
  const worker = await createWorker("eng", 1, {
    logger: (m) => onProgress?.({ status: m.status, progress: m.progress }),
  });

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(file);

    if (!text.trim()) {
      throw new Error(
        "No text could be read from this image. Try a higher-resolution scan or a clearer photo."
      );
    }

    if (confidence < 40) {
      // Still return it — low confidence isn't fatal — but the caller
      // surfaces this so the user knows to sanity-check the result.
      console.warn(`OCR confidence low (${confidence}%) for ${file.name}`);
    }

    return { text: text.trim(), confidence };
  } finally {
    await worker.terminate();
  }
}
