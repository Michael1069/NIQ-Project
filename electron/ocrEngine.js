const { createWorker } = require('tesseract.js');

let worker = null;

/**
 * Perform Optical Character Recognition (OCR) directly on screen snapshot image buffer
 */
async function extractTextFromImage(imageBase64) {
  try {
    console.log('[OCREngine] Extracting text directly from screen image pixels...');
    
    // Clean base64 buffer
    let imageBuffer;
    if (imageBase64.startsWith('data:')) {
      const base64Data = imageBase64.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(imageBase64, 'base64');
    }

    if (!worker) {
      worker = await createWorker('eng');
    }

    const { data: { text } } = await worker.recognize(imageBuffer);
    console.log('[OCREngine] Extracted Image Text:\n', text);
    return text || '';
  } catch (err) {
    console.error('[OCREngine] OCR Extraction Error:', err.message);
    return '';
  }
}

module.exports = {
  extractTextFromImage
};
