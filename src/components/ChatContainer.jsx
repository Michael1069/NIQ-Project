import React, { useState, useEffect, useRef } from 'react';
import { Eye, Cpu, Send, Bot, User, Terminal, CheckCircle2, Shield, Zap, RefreshCw } from 'lucide-react';

export default function ChatContainer({
  session,
  onSendMessage,
  onExecuteCommand,
  isAnalyzing,
  policy
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!session) return null;

  return (
    <div className="niq-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 380, padding: 12 }}>
      {/* Session Metadata Bar */}
      <div className="niq-card-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
        <div className="niq-card-title" style={{ fontSize: 13 }}>
          <Bot size={16} color="#0052FF" />
          NIQ AI Assistant
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="niq-badge niq-badge-blue" style={{ fontSize: 9 }}>{session.systemId}</span>
          <span className="niq-badge niq-badge-blue" style={{ fontSize: 9 }}>#{session.ticketId}</span>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
        {session.messages?.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            {/* Sender Label */}
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              {msg.sender === 'user' ? <User size={10} /> : <Bot size={10} color="#0052FF" />}
              {msg.sender === 'user' ? 'You' : msg.sender === 'vision' ? 'NIQ Vision Scanner' : 'NIQ Assistant'} • {msg.timestamp}
            </span>

            {/* Bubble Container */}
            <div
              style={{
                maxWidth: '88%',
                background: msg.sender === 'user' ? '#0052FF' : msg.sender === 'vision' ? '#F0F5FF' : '#FFFFFF',
                color: msg.sender === 'user' ? '#FFFFFF' : '#0A192F',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 12,
                lineHeight: 1.4,
                boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(0,82,255,0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                borderTopLeftRadius: msg.sender === 'user' ? 14 : 2,
                borderTopRightRadius: msg.sender === 'user' ? 2 : 14
              }}
            >
              {msg.text}

              {/* Inline Executable Action Proposal Card */}
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
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    <Zap size={13} />
                    {policy === 'AUTO' ? 'Running Command Autonomously...' : '⚡ APPROVE & EXECUTE NOW'}
                  </button>
                </div>
              )}

              {/* Command Execution Result Output */}
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

        {isAnalyzing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#0052FF', fontStyle: 'italic' }}>
            <Cpu size={12} className="spin" />
            Analyzing workspace context & generating response...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Interactive Chat Input Bar */}
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
