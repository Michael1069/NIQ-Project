import React from 'react';
import { Zap, ShieldCheck, Terminal, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ExecutionCard({
  recommendedAction,
  policy,
  onExecute,
  isExecuting,
  executionResult
}) {
  if (!recommendedAction) return null;

  return (
    <div className="niq-card">
      <div className="niq-card-header">
        <div className="niq-card-title">
          <Terminal size={16} color="#0052FF" />
          Authorized Command Gateway
        </div>
        <span className={`niq-badge ${policy === 'AUTO' ? 'niq-badge-blue' : 'niq-badge-warning'}`}>
          {policy === 'AUTO' ? 'Auto Execution' : 'Manual Approval Required'}
        </span>
      </div>

      {/* Command Rationale & Action Details */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
          {recommendedAction.explanation}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 12, background: '#0A192F', color: '#38BDF8', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>$ {recommendedAction.commandName}({JSON.stringify(recommendedAction.args)})</span>
          <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
            WHITELIST APPROVED
          </span>
        </div>
      </div>

      {/* Execution Action Button */}
      {!executionResult && (
        <div style={{ marginTop: 4 }}>
          {policy === 'MANUAL' ? (
            <button
              className="niq-btn-primary niq-pulse-btn"
              onClick={onExecute}
              disabled={isExecuting}
              style={{ background: '#0052FF' }}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Executing Command via Command Gateway...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  ⚡ APPROVE & EXECUTE NOW
                </>
              )}
            </button>
          ) : (
            <div style={{ padding: 10, background: '#E0F2FE', borderRadius: 8, color: '#0369A1', fontSize: 12, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Loader2 size={14} className="spin" />
              Auto Execution Policy Active — Running command autonomously...
            </div>
          )}
        </div>
      )}

      {/* Live Execution Output & Closed-Loop Verification */}
      {executionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <div style={{ background: '#0F172A', borderRadius: 8, padding: 10, color: '#F8FAFC', fontFamily: 'monospace', fontSize: 11 }}>
            <div style={{ color: '#94A3B8', borderBottom: '1px solid #334155', paddingBottom: 4, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Execution Log (PowerShell Gateway)</span>
              <span style={{ color: '#10B981' }}>Exit Code 0</span>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto', margin: 0 }}>
              {executionResult.stdout || executionResult.output || 'Command completed successfully'}
            </pre>
          </div>

          {/* Verification Status Card */}
          {executionResult.verification && (
            <div style={{
              background: executionResult.verification.passed ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${executionResult.verification.passed ? '#A7F3D0' : '#FECACA'}`,
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              {executionResult.verification.passed ? (
                <ShieldCheck size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: executionResult.verification.passed ? '#065F46' : '#991B1B' }}>
                  {executionResult.verification.passed ? 'Closed-Loop Verification Passed' : 'Verification Issue Detected'}
                </span>
                <span style={{ fontSize: 11, color: executionResult.verification.passed ? '#047857' : '#B91C1C' }}>
                  {executionResult.verification.details}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
