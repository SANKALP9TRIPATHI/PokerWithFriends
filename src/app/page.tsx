'use client';

// ============================================================
// Landing Page — Vasu-Juari Poker
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // Floating cards animation data
  const floatingCards = ['🂡', '🂱', '🃁', '🃑', '🂢', '🂲', '🃂', '🃒'];

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    // Store nickname in session, navigate to room creation
    sessionStorage.setItem('vj-nickname', nickname.trim());
    sessionStorage.setItem('vj-action', 'create');
    router.push('/room/new');
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    sessionStorage.setItem('vj-nickname', nickname.trim());
    sessionStorage.setItem('vj-action', 'join');
    router.push(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 20,
      }}
    >
      {/* Animated background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(34, 118, 74, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(240, 180, 41, 0.08) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Floating card symbols */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -100, Math.random() * 100],
            x: [null, Math.random() * 50 - 25],
            opacity: [0, 0.08, 0.04],
            rotate: [0, Math.random() * 20 - 10],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.5,
          }}
          style={{
            position: 'absolute',
            fontSize: 60 + Math.random() * 40,
            pointerEvents: 'none',
            zIndex: 0,
            filter: 'blur(1px)',
          }}
        >
          {card}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          zIndex: 10,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Logo / Title */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{ fontSize: 52, marginBottom: 8 }}
          >
            🃏
          </motion.div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 900,
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-light), #fff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Vasu-Juari
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Texas Hold&apos;em with Friends
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 8,
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            Create a room, share the link, and play poker in seconds.
            No accounts needed.
          </p>
        </div>

        {/* Action cards */}
        {mode === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('create')}
              style={{
                padding: '24px 20px',
                borderRadius: 16,
                border: '1px solid rgba(240, 180, 41, 0.2)',
                background: 'rgba(240, 180, 41, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 32 }}>🎯</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--accent-gold-light)',
                  }}
                >
                  Create Room
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Host a new poker table for your friends
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
              style={{
                padding: '24px 20px',
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.15)',
                background: 'rgba(148, 163, 184, 0.05)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 32 }}>🚪</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--text-primary)',
                  }}
                >
                  Join Room
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Enter a room code to join your friends
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 24,
              borderRadius: 16,
            }}
            className="glass"
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Create a Room
            </h2>
            <input
              className="input"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={20}
              autoFocus
            />
            {error && (
              <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setMode('home');
                  setError('');
                }}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!nickname.trim()}
                style={{ flex: 2 }}
              >
                Create Room 🎯
              </button>
            </div>
          </motion.div>
        )}

        {/* Join form */}
        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 24,
              borderRadius: 16,
            }}
            className="glass"
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Join a Room
            </h2>
            <input
              className="input"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              maxLength={20}
              autoFocus
            />
            <input
              className="input"
              placeholder="Room code (e.g. ABC123)"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 20,
                textAlign: 'center',
              }}
            />
            {error && (
              <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setMode('home');
                  setError('');
                }}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleJoin}
                disabled={!nickname.trim() || !roomCode.trim()}
                style={{ flex: 2 }}
              >
                Join Room 🚪
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          For fun only — no real money gambling.
          <br />
          Built with ❤️ by Vasu & Juari
        </p>
      </motion.div>
    </div>
  );
}
