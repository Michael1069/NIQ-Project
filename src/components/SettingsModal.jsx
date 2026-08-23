import React, { useState, useEffect } from 'react';
import { Key, Save, X, Shield, Cpu, Eye } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [visionKey, setVisionKey] = useState('');
  const [reasoningKey, setReasoningKey] = useState('');

  useEffect(() => {
    if (settings) {
      setVisionKey(settings.groqVisionApiKey || '');
      setReasoningKey(settings.groqReasoningApiKey || '');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      groqVisionApiKey: visionKey,
      groqReasoningApiKey: reasoningKey
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 25, 47, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="niq-card" style={{ width: '100%', maxWidth: 380, gap: 16 }}>
        <div className="niq-card-header">
          <div className="niq-card-title">
            <Key size={16} color="#0052FF" />
            Groq API Key Configuration
          </div>
          <button className="niq-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Vision Model API Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#0A192F', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} color="#0052FF" /> Groq Vision Model API Key:
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={visionKey}
              onChange={(e) => setVisionKey(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Reasoning Model API Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#0A192F', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Cpu size={12} color="#0052FF" /> Groq Reasoning Model API Key:
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={reasoningKey}
              onChange={(e) => setReasoningKey(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
          </div>

          <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
            If left empty, NIQ HelpDeskAI automatically runs in high-fidelity <strong>Offline Simulation Mode</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="niq-btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="niq-btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            <Save size={14} /> Save Keys
          </button>
        </div>
      </div>
    </div>
  );
}
