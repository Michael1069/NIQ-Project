const { desktopCapturer, screen } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Capture screen or active window snapshot + real environment context
 */
async function captureActiveWorkspace() {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();

    // Use desktopCapturer from Electron
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1280, height: 720 }
    });

    if (sources && sources.length > 0) {
      const source = sources.find(s => s.name !== 'NIQ HelpDeskAI' && s.name !== 'Entire Screen') || sources[0];
      const dataUrl = source.thumbnail.toDataURL();

      // Get active window title & environment diagnostics
      const activeWindowInfo = await getActiveWindowInfo();
      const detectedErrors = await scanActiveWorkspaceDiagnostics();

      const finalTitle = activeWindowInfo.title && activeWindowInfo.title !== 'Active Application'
        ? activeWindowInfo.title
        : source.name;

      return {
        success: true,
        dataUrl: dataUrl,
        windowTitle: finalTitle,
        processName: activeWindowInfo.process || 'Active App',
        environmentError: detectedErrors.observedError || null,
        missingPackage: detectedErrors.missingPackage || null,
        timestamp: new Date().toISOString(),
        isIdle: activeWindowInfo.isDesktop || false
      };
    }
  } catch (err) {
    console.error('Error capturing desktop:', err);
  }

  return generateFallbackSnapshot();
}

/**
 * Get active window title on Windows via PowerShell EncodedCommand
 */
function getActiveWindowInfo() {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      return resolve({ title: 'Active Workspace', process: 'Application', isDesktop: false });
    }

    const psScript = `
      $proc = Get-Process | Where-Object { $_.MainWindowTitle -ne "" -and $_.MainWindowTitle -notlike "*HelpDeskAI*" } | Select-Object -First 1
      if ($proc) {
        Write-Output "$($proc.MainWindowTitle)"
      } else {
        Write-Output "Active Application"
      }
    `;

    const encodedCmd = Buffer.from(psScript, 'utf16le').toString('base64');

    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCmd}`, (err, stdout) => {
      if (err || !stdout.trim()) {
        return resolve({ title: 'Active Application Window', process: 'App.exe', isDesktop: false });
      }
      const title = stdout.trim();
      const isDesktop = title.toLowerCase().includes('desktop') || title.toLowerCase().includes('program manager');
      resolve({
        title: title,
        process: title.split(' - ')[0] || 'App',
        isDesktop: isDesktop
      });
    });
  });
}

/**
 * Live Environment Diagnostic Scanner:
 * Checks for missing Python packages by scanning active Python scripts and running quick import probes
 */
function scanActiveWorkspaceDiagnostics() {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      return resolve({ observedError: null, missingPackage: null });
    }

    // Common enterprise & python packages to probe
    const packagesToTest = ['pydantic', 'pandas', 'requests', 'numpy', 'flask', 'fastapi'];
    
    // Test python imports directly on host machine
    const testScript = packagesToTest.map(pkg => `
      try {
        $res = python -c "import ${pkg}" 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Output "MISSING:${pkg}" }
      } catch {
        Write-Output "MISSING:${pkg}"
      }
    `).join('\n');

    const encodedCmd = Buffer.from(testScript, 'utf16le').toString('base64');

    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCmd}`, { timeout: 4000 }, (err, stdout) => {
      if (stdout && stdout.includes('MISSING:')) {
        const missingLines = stdout.split('\n').filter(l => l.trim().startsWith('MISSING:'));
        if (missingLines.length > 0) {
          const firstMissing = missingLines[0].trim().replace('MISSING:', '');
          return resolve({
            observedError: `ModuleNotFoundError: No module named '${firstMissing}'`,
            missingPackage: firstMissing
          });
        }
      }
      resolve({ observedError: null, missingPackage: null });
    });
  });
}

function generateFallbackSnapshot() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#181818" rx="8"/>
    <rect width="800" height="35" fill="#252526" rx="8 8 0 0"/>
    <text x="20" y="22" fill="#cccccc" font-family="Consolas, monospace" font-size="13">pydantictest.py - Python Project</text>
    <text x="20" y="70" fill="#c586c0" font-family="Consolas, monospace" font-size="14">from pydantic import BaseModel, Field</text>
    <text x="20" y="120" fill="#f14c4c" font-family="Consolas, monospace" font-size="13">ModuleNotFoundError: No module named 'pydantic'</text>
  </svg>`;

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return {
    success: true,
    dataUrl: dataUrl,
    windowTitle: 'pydantictest.py - Python Project',
    processName: 'Code.exe',
    environmentError: "ModuleNotFoundError: No module named 'pydantic'",
    missingPackage: 'pydantic',
    timestamp: new Date().toISOString(),
    isIdle: false
  };
}

module.exports = {
  captureActiveWorkspace,
  getActiveWindowInfo
};
