import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Search, CheckCircle2, RefreshCw, Zap, Terminal, XCircle, Camera, AlertCircle } from 'lucide-react';

export default function ChatContainer({
  session,
  onSendMessage,
  onExecuteCommand,
  onScanWorkspace,
  onConfirmSnapshot,
  onConfirmResolved,
  onReinvestigate,
  snapshot,
  isScanning,
  isAnalyzing,
  isConfirmed,
  policy
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, snapshot, isAnalyzing, isConfirmed]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!session) return null;

  return (
    <div className="niq-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', margin: 0, padding: 14 }}>
      {/* Session Metadata Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#0A192F' }}>
            NIQ AI Support Assistant
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="niq-badge niq-badge-blue" style={{ fontSize: 9 }}>{session.systemId}</span>
          <span className="niq-badge niq-badge-blue" style={{ fontSize: 9 }}>#{session.ticketId}</span>
        </div>
      </div>

      {/* Unified Single Chat Stream */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
        {/* Initial AI Greeting & Scan Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Bot size={11} color="#0052FF" /> NIQ Assistant
          </span>
          <div style={{ background: '#FFFFFF', color: '#0A192F', borderRadius: '2px 14px 14px 14px', padding: '12px 14px', fontSize: 12, lineHeight: 1.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '94%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p>
              Hello! I am NIQ HelpDeskAI, monitoring <strong>{session.systemId}</strong>. What would you like to troubleshoot today?
            </p>

            <button
              className="niq-btn-primary niq-pulse-btn"
              onClick={onScanWorkspace}
              disabled={isScanning}
              style={{ width: '100%', padding: '10px 14px', fontSize: 12 }}
            >
              <Search size={14} />
              {isScanning ? 'Scanning Active Workspace...' : '🔍 Troubleshoot Active Workspace'}
            </button>
          </div>
        </div>

        {/* Captured Workspace Snapshot Preview inside Chat Stream */}
        {snapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Camera size={11} color="#0052FF" /> Captured Context
            </span>
            <div style={{ background: '#FFFFFF', borderRadius: '2px 14px 14px 14px', padding: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '94%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0052FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                Target: {snapshot.windowTitle}
              </div>

              <div className="niq-snapshot-frame">
                <img src={snapshot.dataUrl} alt="Active Window Snapshot" className="niq-snapshot-img" />
              </div>

              <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', margin: 0 }}>
                Is this what you want to troubleshoot?
              </p>

              <div style={{ display: 'flex', gap: 6 }}>
                <button className="niq-btn-secondary" onClick={onScanWorkspace} disabled={isAnalyzing} style={{ flex: 1, padding: '8px 10px', fontSize: 11 }}>
                  <RefreshCw size={12} /> Retake
                </button>
                <button className="niq-btn-primary" onClick={onConfirmSnapshot} disabled={isAnalyzing} style={{ flex: 2, padding: '8px 10px', fontSize: 11 }}>
                  <CheckCircle2 size={13} />
                  {isAnalyzing ? 'Analyzing...' : 'Troubleshoot This Window'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Chat Messages Thread */}
        {session.messages?.slice(1).map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              {msg.sender === 'user' ? <User size={10} /> : <Bot size={10} color="#0052FF" />}
              {msg.sender === 'user' ? 'You' : msg.sender === 'vision' ? 'NIQ Vision Scanner' : 'NIQ Assistant'} • {msg.timestamp}
            </span>

            <div
              style={{
                maxWidth: '92%',
                background: msg.sender === 'user' ? '#0052FF' : '#FFFFFF',
                color: msg.sender === 'user' ? '#FFFFFF' : '#0A192F',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 12,
                lineHeight: 1.5,
                boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(0,82,255,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
                border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                borderTopLeftRadius: msg.sender === 'user' ? 14 : 2,
                borderTopRightRadius: msg.sender === 'user' ? 2 : 14
              }}
            >
              {msg.text}

              {/* Inline Executable Action Proposal */}
              {msg.actionProposal && (
                <div style={{ marginTop: 10, background: '#F8FAFC', borderRadius: 10, padding: 10, border: '1px solid #CBD5E1', color: '#0A192F' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0052FF', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Terminal size={12} /> Proposed Command Action
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                    {msg.actionProposal.explanation}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, background: '#0A192F', color: '#38BDF8', padding: '6px 10px', borderRadius: 6, marginBottom: 8 }}>
                    $ {msg.actionProposal.commandName}({JSON.stringify(msg.actionProposal.args)})
                  </div>

                  <button
                    className="niq-btn-primary"
                    onClick={() => onExecuteCommand(msg.actionProposal)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
                  >
                    <Zap size={13} />
                    {policy === 'AUTO' ? 'Running Command Autonomously...' : '⚡ APPROVE & EXECUTE NOW'}
                  </button>
                </div>
              )}

              {/* Execution Result Log */}
              {msg.executionResult && (
                <div style={{ marginTop: 8, background: '#0F172A', color: '#F8FAFC', padding: 8, borderRadius: 6, fontFamily: 'monospace', fontSize: 10 }}>
                  <div style={{ color: '#10B981', fontWeight: 'bold', marginBottom: 2 }}>
                    ✓ Execution Completed
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, maxHeight: 80, overflowY: 'auto' }}>
                    {msg.executionResult.stdout}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Final Employee Resolution Confirmation inside Chat Stream */}
        {session.messages?.some(m => m.actionProposal || m.executionResult) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={11} color="#10B981" /> Resolution Confirmation
            </span>

            {isConfirmed ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '2px 14px 14px 14px', padding: 12, width: '94%', color: '#065F46', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                🎉 Ticket #{session.ticketId} Closed — Issue Resolved!
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', borderRadius: '2px 14px 14px 14px', padding: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '94%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#0A192F', margin: 0 }}>
                  Is the issue resolved on your side?
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="niq-btn-secondary" onClick={onReinvestigate} style={{ flex: 1, padding: '6px 10px', fontSize: 11, borderColor: '#FCA5A5', color: '#B91C1C' }}>
                    <XCircle size={12} /> No, Issue Persists
                  </button>
                  <button className="niq-btn-primary" onClick={onConfirmResolved} style={{ flex: 1, padding: '6px 10px', fontSize: 11, background: '#10B981' }}>
                    <CheckCircle2 size={12} /> Yes, It's Fixed!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Interactive Input Bar at Bottom */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
        <input
          type="text"
          placeholder="Ask AI or type instructions..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          className="niq-btn-primary"
          style={{ width: 'auto', padding: '0 16px', borderRadius: 10 }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
