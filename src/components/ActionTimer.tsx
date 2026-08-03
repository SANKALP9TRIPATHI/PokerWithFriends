'use client';

// ============================================================
// Action Timer Component
// ============================================================

import { motion } from 'framer-motion';

interface ActionTimerProps {
  timeLeft: number | null;
  maxTime: number;
  isMyTurn: boolean;
  currentPlayerName?: string;
}

export default function ActionTimer({ timeLeft, maxTime, isMyTurn, currentPlayerName }: ActionTimerProps) {
  if (timeLeft === null || timeLeft < 0) return null;

  const progress = timeLeft / maxTime;

  const getColor = () => {
    if (progress > 0.5) return '#22c55e'; // success
    if (progress > 0.25) return '#f0b429'; // accent-gold
    return '#ef4444'; // error
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '0 20px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.05em',
        }}
      >
        {isMyTurn ? (
          <span style={{ color: 'var(--accent-gold)' }}>YOUR TURN ({timeLeft}s)</span>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>
            Waiting for {currentPlayerName}... ({timeLeft}s)
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        <motion.div
          animate={{ width: `${Math.max(0, progress * 100)}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{
            height: '100%',
            background: getColor(),
            borderRadius: 5,
            boxShadow: `0 0 10px ${getColor()}`,
          }}
        />
      </div>
    </div>
  );
}
