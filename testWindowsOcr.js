const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Test Windows Native OCR (Windows.Media.Ocr.OcrEngine)
 */
function testNativeOcr(imagePath) {
  return new Promise((resolve) => {
    const psScript = `
      [void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
      [void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
      [void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]

      $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync("${imagePath.replace(/\\/g, '\\\\')}").GetResults()
      $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetResults()
      $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
      $bitmap = $decoder.GetSoftwareBitmapAsync().GetResults()

      $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguage()
      $result = $engine.RecognizeAsync($bitmap).GetResults()
      Write-Output $result.Text
    `;

    const encodedCmd = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCmd}`, (err, stdout) => {
      resolve(stdout ? stdout.trim() : '');
    });
  });
}

console.log('Testing Windows Native OCR Engine...');
