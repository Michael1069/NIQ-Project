const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  captureWorkspace: () => ipcRenderer.invoke('capture-workspace'),
  analyzeVision: (data) => ipcRenderer.invoke('analyze-vision', data),
  sendChatMessage: (messageText) => ipcRenderer.invoke('send-chat-message', messageText),
  executeCommand: (data) => ipcRenderer.invoke('execute-command', data),
  getSession: () => ipcRenderer.invoke('get-session'),
  clearSession: () => ipcRenderer.invoke('clear-session'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  hideSidebar: () => ipcRenderer.invoke('hide-sidebar'),
  onTogglePolicy: (callback) => {
    ipcRenderer.on('toggle-policy', () => callback());
  }
});
