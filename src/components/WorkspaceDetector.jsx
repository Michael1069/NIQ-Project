import React from 'react';
import { Search, AlertCircle, ArrowRight, Monitor } from 'lucide-react';

export default function WorkspaceDetector({ isIdle, onScanWorkspace, isScanning }) {
  return (
    <div className="niq-card">
      <div className="niq-card-header">
        <div className="niq-card-title">
          <Monitor size={16} color="#0052FF" />
          Workspace Scanner
        </div>
        <span className="niq-badge niq-badge-blue">Step 1 of 4</span>
      </div>

      {isIdle ? (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontWeight: 600, fontSize: 13 }}>
            <AlertCircle size={16} />
            No Faulty Workspace Detected
          </div>
          <p style={{ fontSize: 12, color: '#78350F', lineHeight: 1.4 }}>
            "I don't find any trouble here. Please locate to the workspace or faulty application window where you'd like to troubleshoot."
          </p>
          <button
            className="niq-btn-primary niq-pulse-btn"
            onClick={onScanWorkspace}
            disabled={isScanning}
            style={{ marginTop: 4 }}
          >
            {isScanning ? 'Scanning Active Windows...' : 'I Am At Faulty Workspace — Scan Now'}
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
            What would you like to troubleshoot today?
          </p>

          <button
            className="niq-btn-primary niq-pulse-btn"
            onClick={onScanWorkspace}
            disabled={isScanning}
          >
            <Search size={15} />
            {isScanning ? 'Scanning Active Workspace...' : 'Troubleshoot Active Workspace'}
          </button>
        </div>
      )}
    </div>
  );
}
