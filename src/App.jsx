import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import SettingsModal from './components/SettingsModal';
import './styles/niq-theme.css';

export default function App() {
  const [policy, setPolicy] = useState('MANUAL');
  const [isScanning, setIsScanning] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [session, setSession] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((s) => {
        setSettings(s);
        if (s?.executionPolicy) setPolicy(s.executionPolicy);
      });

      window.electronAPI.getSession().then((sess) => {
        setSession(sess);
      });

      window.electronAPI.onTogglePolicy(() => {
        setPolicy((prev) => (prev === 'AUTO' ? 'MANUAL' : 'AUTO'));
      });
    }
  }, []);

  const handleTogglePolicy = (newPolicy) => {
    setPolicy(newPolicy);
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ executionPolicy: newPolicy });
    }
  };

  // Step 1: Scan active workspace
  const handleScanWorkspace = async () => {
    setIsScanning(true);
    setIsIdle(false);
    setSnapshot(null);
    setIsConfirmed(false);

    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.captureWorkspace();
        if (res?.isIdle) {
          setIsIdle(true);
        } else {
          setSnapshot(res);
        }
      } else {
        setSnapshot({
          dataUrl: 'data:image/png;base64,...',
          windowTitle: 'Active Application Window',
          processName: 'App',
          isIdle: false
        });
      }
    } catch (err) {
      console.error('Error scanning workspace:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Step 2: Confirm snapshot & trigger Vision Analysis
  const handleConfirmSnapshot = async () => {
    if (!snapshot || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      if (window.electronAPI) {
        const envDetails = snapshot.environmentError ? ` | Observed Error: ${snapshot.environmentError}` : '';
        const pkgDetails = snapshot.missingPackage ? ` | Missing Package: ${snapshot.missingPackage}` : '';
        const res = await window.electronAPI.analyzeVision({
          imageBase64: snapshot.dataUrl,
          userPrompt: `Target Window: ${snapshot.windowTitle}${envDetails}${pkgDetails}`
        });

        setSession(res.session);

        if (policy === 'AUTO' && res.reasoning?.actionProposal && !isExecuting) {
          handleExecuteCommand(res.reasoning.actionProposal);
        }
      }
    } catch (err) {
      console.error('Error in vision analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3: Interactive Chat Message Handler
  const handleSendMessage = async (userMessage) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.sendChatMessage(userMessage);
        setSession(res.session);

        if (policy === 'AUTO' && res.actionProposal && !isExecuting) {
          handleExecuteCommand(res.actionProposal);
        }
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 4: Execute Command via Authorized Command Gateway
  const handleExecuteCommand = async (actionToRun) => {
    if (!actionToRun || isExecuting) return;
    setIsExecuting(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.executeCommand({
          commandName: actionToRun.commandName,
          args: actionToRun.args,
          policy: policy
        });
        const updatedSession = await window.electronAPI.getSession();
        setSession(updatedSession);
      }
    } catch (err) {
      console.error('Error executing command:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConfirmResolved = () => {
    setIsConfirmed(true);
  };

  const handleStartNewSession = async () => {
    if (window.electronAPI) {
      const sess = await window.electronAPI.clearSession();
      setSession(sess);
    }
    setSnapshot(null);
    setIsConfirmed(false);
  };

  const handleReinvestigate = async () => {
    await handleStartNewSession();
    handleScanWorkspace();
  };

  const handleCloseSidebar = () => {
    if (window.electronAPI) {
      window.electronAPI.hideSidebar();
    }
  };

  const handleSaveSettings = async (newSettings) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.saveSettings(newSettings);
      setSettings(res.settings);
    }
  };

  return (
    <div className="niq-sidebar-container">
      <Header
        policy={policy}
        onTogglePolicy={handleTogglePolicy}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCloseSidebar={handleCloseSidebar}
      />

      <div className="niq-content-area" style={{ padding: 10, display: 'flex', flexDirection: 'column' }}>
        <ChatContainer
          session={session}
          onSendMessage={handleSendMessage}
          onExecuteCommand={handleExecuteCommand}
          onScanWorkspace={handleScanWorkspace}
          onConfirmSnapshot={handleConfirmSnapshot}
          onConfirmResolved={handleConfirmResolved}
          onReinvestigate={handleReinvestigate}
          onStartNewSession={handleStartNewSession}
          snapshot={snapshot}
          isScanning={isScanning}
          isAnalyzing={isAnalyzing}
          isExecuting={isExecuting}
          isConfirmed={isConfirmed}
          policy={policy}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
