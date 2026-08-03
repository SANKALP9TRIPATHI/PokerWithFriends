'use client';

// ============================================================
// Pot Display Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Pot } from '@/lib/types';

interface PotDisplayProps {
  pots: Pot[];
}

export default function PotDisplay({ pots }: PotDisplayProps) {
  const totalPot = pots.reduce((sum, p) => sum + p.amount, 0);

  if (totalPot === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Main pot */}
      <motion.div
        key={totalPot}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          borderRadius: 20,
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(240, 180, 41, 0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: 18 }}>🪙</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--accent-gold-light)',
          }}
        >
          {totalPot.toLocaleString()}
        </span>
      </motion.div>

      {/* Side pots */}
      {pots.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pots.map((pot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {i === 0 ? 'Main' : `Side ${i}`}: {pot.amount.toLocaleString()}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
