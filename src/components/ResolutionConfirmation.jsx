import React from 'react';
import { CheckCircle2, XCircle, RotateCcw, PartyPopper } from 'lucide-react';

export default function ResolutionConfirmation({ onConfirmResolved, onReinvestigate, isConfirmed }) {
  if (isConfirmed) {
    return (
      <div className="niq-card" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
        <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <PartyPopper size={32} color="#10B981" />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>Ticket Closed — Issue Resolved!</h3>
          <p style={{ fontSize: 12, color: '#047857', maxWidth: 280 }}>
            Thank you! The automated audit trail and resolution history have been saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="niq-card">
      <div className="niq-card-header">
        <div className="niq-card-title">
          <CheckCircle2 size={16} color="#10B981" />
          Employee Confirmation
        </div>
        <span className="niq-badge niq-badge-success">Step 4 of 4</span>
      </div>

      <p style={{ fontSize: 13, color: '#0A192F', fontWeight: 600, textAlign: 'center' }}>
        Is the issue resolved on your side?
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          className="niq-btn-secondary"
          onClick={onReinvestigate}
          style={{ flex: 1, borderColor: '#FCA5A5', color: '#B91C1C' }}
        >
          <XCircle size={15} />
          No, Issue Persists
        </button>

        <button
          className="niq-btn-primary"
          onClick={onConfirmResolved}
          style={{ flex: 1, background: '#10B981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
        >
          <CheckCircle2 size={15} />
          Yes, It's Fixed!
        </button>
      </div>
    </div>
  );
}
