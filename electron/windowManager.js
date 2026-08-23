const { BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

/**
 * Create frameless right-edge OS sidebar window
 */
function createSidebarWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const { x, y } = primaryDisplay.workArea;

  const sidebarWidth = 440;

  mainWindow = new BrowserWindow({
    width: sidebarWidth,
    height: height,
    x: x + width - sidebarWidth,
    y: y,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: true,
    backgroundColor: '#F4F6F9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Toggle OS Sidebar Visibility with Hotkey Show / Minimize / Hide
 */
function toggleSidebar() {
  if (!mainWindow) {
    createSidebarWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  } else {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const { x, y } = primaryDisplay.workArea;
    const sidebarWidth = 440;

    mainWindow.setPosition(x + width - sidebarWidth, y);
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * Setup Windows System Tray Taskbar Icon with Fallback Canvas Image
 */
function createSystemTray() {
  if (tray) return tray;

  const iconPath = path.join(__dirname, 'assets/icon.png');
  let icon;

  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // Generate a fallback 16x16 solid blue icon if PNG is missing
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="#0052FF" rx="3"/><text x="2" y="12" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold">N</text></svg>`;
    icon = nativeImage.createFromBuffer(Buffer.from(svg));
  }

  try {
    tray = new Tray(icon);
    tray.setToolTip('NIQ HelpDeskAI - Enterprise IT Support');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open NIQ HelpDeskAI (F9 / Ctrl+Shift+H)',
        click: () => toggleSidebar()
      },
      {
        label: 'Toggle Policy (Auto/Manual)',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('toggle-policy');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Exit Enterprise Software',
        click: () => {
          if (mainWindow) mainWindow.destroy();
          if (tray) tray.destroy();
          process.exit(0);
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      toggleSidebar();
    });

    tray.on('double-click', () => {
      toggleSidebar();
    });
  } catch (e) {
    console.error('Failed to create System Tray:', e);
  }

  return tray;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createSidebarWindow,
  createSystemTray,
  toggleSidebar,
  getMainWindow
};
