'use client';

// ============================================================
// Action Timer Component
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ActionTimerProps {
  timeLeft: number | null;
  maxTime: number;
  isMyTurn: boolean;
}

export default function ActionTimer({ timeLeft, maxTime, isMyTurn }: ActionTimerProps) {
  if (timeLeft === null || timeLeft < 0) return null;

  const progress = timeLeft / maxTime;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return '#22c55e';
    if (progress > 0.25) return '#eab308';
    return '#ef4444';
  };

  return (
    <div
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="22"
          cy="22"
          r="18"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
          fill="none"
        />
        <motion.circle
          cx="22"
          cy="22"
          r="18"
          stroke={getColor()}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          fontSize: 13,
          fontWeight: 700,
          color: getColor(),
          fontFamily: 'var(--font-display)',
        }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
