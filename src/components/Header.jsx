import React from 'react';
import { Settings, X, Shield, Zap } from 'lucide-react';

export default function Header({ policy, onTogglePolicy, onOpenSettings, onCloseSidebar }) {
  return (
    <header className="niq-header">
      <div className="niq-logo-section">
        <div className="niq-logo-badge">NIQ</div>
        <div className="niq-app-title">
          <span className="niq-app-name">HelpDeskAI</span>
          <span className="niq-tagline">Intelligence for an AI world</span>
        </div>
      </div>

      <div className="niq-header-actions">
        {/* Policy Switch (Auto / Manual) */}
        <div className="niq-policy-switch" title="Toggle Execution Policy">
          <button
            className={`niq-policy-btn ${policy === 'AUTO' ? 'active-auto' : ''}`}
            onClick={() => onTogglePolicy('AUTO')}
          >
            <Zap size={11} style={{ marginRight: 3, display: 'inline' }} />
            AUTO
          </button>
          <button
            className={`niq-policy-btn ${policy === 'MANUAL' ? 'active-manual' : ''}`}
            onClick={() => onTogglePolicy('MANUAL')}
          >
            <Shield size={11} style={{ marginRight: 3, display: 'inline' }} />
            MANUAL
          </button>
        </div>

        <button className="niq-icon-btn" onClick={onOpenSettings} title="Settings & Groq API Keys">
          <Settings size={16} />
        </button>

        <button className="niq-icon-btn" onClick={onCloseSidebar} title="Close Sidebar">
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
