'use client';

// ============================================================
// Chat Panel Component
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/lib/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatPanel({ messages, onSend, isOpen, onToggle }: ChatPanelProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          zIndex: 50,
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.2s ease',
        }}
      >
        💬
        {messages.length > 0 && !isOpen && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--error)',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {Math.min(messages.length, 9)}
          </div>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              width: 320,
              maxHeight: 400,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: 'var(--shadow-lg)',
            }}
            className="glass-strong"
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              Chat
              <button
                onClick={onToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: 200,
                maxHeight: 280,
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    padding: 20,
                  }}
                >
                  No messages yet
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {msg.isSystem ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}
                    >
                      {msg.text}
                    </span>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--accent-gold)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {msg.nickname}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.text}
                      </span>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 12px', minWidth: 'auto' }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
