const { app, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Disable GPU disk cache warnings/conflicts on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu');

// Load .env configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const { createSidebarWindow, createSystemTray, toggleSidebar, getMainWindow } = require('./windowManager');
const { captureActiveWorkspace } = require('./screenCapturer');
const { executeAuthorizedCommand } = require('./commandGateway');
const { analyzeVisionSnapshot, chatWithReasoningAgent } = require('./groqClient');
const sessionStore = require('./sessionStore');

let appSettings = {
  groqVisionApiKey: process.env.GROQ_VISION_API_KEY || '',
  groqReasoningApiKey: process.env.GROQ_REASONING_API_KEY || '',
  executionPolicy: process.env.DEFAULT_EXECUTION_POLICY || 'MANUAL'
};

app.whenReady().then(() => {
  createSidebarWindow();
  createSystemTray();

  try {
    globalShortcut.register('CommandOrControl+Alt+H', () => {
      toggleSidebar();
    });
    globalShortcut.register('Alt+Shift+H', () => {
      toggleSidebar();
    });
  } catch (err) {
    console.error('Failed to register global hotkey:', err);
  }

  ipcMain.handle('capture-workspace', async () => {
    const snapshot = await captureActiveWorkspace();
    sessionStore.setSnapshot(snapshot);
    return snapshot;
  });

  ipcMain.handle('analyze-vision', async (event, { imageBase64, userPrompt }) => {
    const result = await analyzeVisionSnapshot(imageBase64, userPrompt, appSettings.groqVisionApiKey);
    sessionStore.setVisionAnalysis(result.textAnalysis, {
      detectedError: result.detectedError,
      missingPackage: result.missingPackage
    });

    sessionStore.addMessage('vision', result.textAnalysis, {
      missingPackage: result.missingPackage,
      detectedError: result.detectedError
    });

    // Request single reasoning turn
    const session = sessionStore.getSession();
    const reasoning = await chatWithReasoningAgent(
      session.messages,
      "Summarize the workspace analysis.",
      { missingPackage: result.missingPackage, detectedError: result.detectedError },
      appSettings.groqReasoningApiKey
    );

    if (reasoning.textResponse) {
      sessionStore.addMessage('agent', reasoning.textResponse, {
        actionProposal: reasoning.actionProposal
      });
    }

    return {
      session: sessionStore.getSession(),
      visionResult: result,
      reasoning: reasoning
    };
  });

  ipcMain.handle('send-chat-message', async (event, messageText) => {
    sessionStore.addMessage('user', messageText);
    const session = sessionStore.getSession();

    const reasoning = await chatWithReasoningAgent(
      session.messages,
      messageText,
      { missingPackage: session.missingPackage, detectedError: session.detectedError },
      appSettings.groqReasoningApiKey
    );

    const agentMsg = sessionStore.addMessage('agent', reasoning.textResponse, {
      actionProposal: reasoning.actionProposal
    });

    return {
      session: sessionStore.getSession(),
      agentMessage: agentMsg,
      actionProposal: reasoning.actionProposal
    };
  });

  ipcMain.handle('execute-command', async (event, { commandName, args, policy }) => {
    const res = await executeAuthorizedCommand(commandName, args, policy || appSettings.executionPolicy);
    sessionStore.addMessage('system', `Command Execution Result: ${res.stdout}`, { executionResult: res });
    return res;
  });

  ipcMain.handle('get-session', () => {
    return sessionStore.getSession();
  });

  ipcMain.handle('clear-session', () => {
    sessionStore.resetSession();
    return sessionStore.getSession();
  });

  ipcMain.handle('get-settings', () => {
    return appSettings;
  });

  ipcMain.handle('save-settings', (event, newSettings) => {
    appSettings = { ...appSettings, ...newSettings };
    return { success: true, settings: appSettings };
  });

  ipcMain.handle('hide-sidebar', () => {
    toggleSidebar();
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
