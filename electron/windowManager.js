const { BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isVisible = false;

/**
 * Create frameless right-edge OS sidebar window
 */
function createSidebarWindow() {
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
    show: true, // Show window on startup
    backgroundColor: '#F4F6F9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Load React app URL (built dist/index.html or Vite dev server)
  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Toggle OS Sidebar Visibility with right-edge animation
 */
function toggleSidebar() {
  if (!mainWindow) {
    createSidebarWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide();
    isVisible = false;
  } else {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const { x, y } = primaryDisplay.workArea;
    const sidebarWidth = 440;

    mainWindow.setPosition(x + width - sidebarWidth, y);
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
  }
}

/**
 * Setup Windows System Tray Taskbar Icon
 */
function createSystemTray() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  let icon;

  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('NIQ HelpDeskAI - Enterprise IT Support');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'NIQ HelpDeskAI (Active)',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Troubleshooting Side Panel',
      click: () => toggleSidebar()
    },
    {
      label: 'Toggle Execution Policy (Auto / Manual)',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('toggle-policy');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        tray.destroy();
        process.exit(0);
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleSidebar());
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
