import React from 'react';
import { Camera, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SnapshotCard({ snapshot, onConfirmSnapshot, isAnalyzing, onRetake }) {
  if (!snapshot) return null;

  return (
    <div className="niq-card">
      <div className="niq-card-header">
        <div className="niq-card-title">
          <Camera size={16} color="#0052FF" />
          Captured Workspace Context
        </div>
        <span className="niq-badge niq-badge-blue">Step 2 of 4</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: '#0A192F', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
        Target: <span style={{ color: '#0052FF' }}>{snapshot.windowTitle}</span>
      </div>

      {/* Snapshot Image Preview Frame */}
      <div className="niq-snapshot-frame">
        <img src={snapshot.dataUrl} alt="Active Workspace Snapshot" className="niq-snapshot-img" />
      </div>

      <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', fontWeight: 500 }}>
        Is this what you want to troubleshoot?
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="niq-btn-secondary"
          onClick={onRetake}
          disabled={isAnalyzing}
          style={{ flex: 1 }}
        >
          <RefreshCw size={14} /> Retake
        </button>

        <button
          className="niq-btn-primary"
          onClick={onConfirmSnapshot}
          disabled={isAnalyzing}
          style={{ flex: 2 }}
        >
          <CheckCircle2 size={15} />
          {isAnalyzing ? 'Analyzing with Vision Model...' : 'Troubleshoot This Window'}
        </button>
      </div>
    </div>
  );
}
