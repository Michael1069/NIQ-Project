import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkspaceDetector from './components/WorkspaceDetector';
import SnapshotCard from './components/SnapshotCard';
import ChatContainer from './components/ChatContainer';
import ResolutionConfirmation from './components/ResolutionConfirmation';
import SettingsModal from './components/SettingsModal';
import './styles/niq-theme.css';

export default function App() {
  const [policy, setPolicy] = useState('MANUAL');
  const [isScanning, setIsScanning] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [session, setSession] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  // Load app settings and session store on startup
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

  // Step 2: Confirm snapshot & trigger Vision Model (Natural Text)
  const handleConfirmSnapshot = async () => {
    if (!snapshot) return;
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

        // Auto execute if policy is AUTO and action exists
        if (policy === 'AUTO' && res.reasoning?.actionProposal) {
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
    setIsAnalyzing(true);
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.sendChatMessage(userMessage);
        setSession(res.session);

        if (policy === 'AUTO' && res.actionProposal) {
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
    if (!actionToRun) return;
    setIsAnalyzing(true);
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
      setIsAnalyzing(false);
    }
  };

  const handleConfirmResolved = () => {
    setIsConfirmed(true);
  };

  const handleReinvestigate = async () => {
    if (window.electronAPI) {
      const sess = await window.electronAPI.clearSession();
      setSession(sess);
    }
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

      <div className="niq-content-area">
        {/* Step 1: Workspace Scanner */}
        <WorkspaceDetector
          isIdle={isIdle}
          onScanWorkspace={handleScanWorkspace}
          isScanning={isScanning}
        />

        {/* Step 2: Captured Workspace Context */}
        <SnapshotCard
          snapshot={snapshot}
          onConfirmSnapshot={handleConfirmSnapshot}
          isAnalyzing={isAnalyzing}
          onRetake={handleScanWorkspace}
        />

        {/* Step 3: Interactive Multi-Turn Chat Container */}
        <ChatContainer
          session={session}
          onSendMessage={handleSendMessage}
          onExecuteCommand={handleExecuteCommand}
          isAnalyzing={isAnalyzing}
          policy={policy}
        />

        {/* Step 4: Resolution Confirmation */}
        {session?.messages?.some(m => m.actionProposal || m.executionResult) && (
          <ResolutionConfirmation
            onConfirmResolved={handleConfirmResolved}
            onReinvestigate={handleReinvestigate}
            isConfirmed={isConfirmed}
          />
        )}
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
