'use client';

// ============================================================
// Playing Card Component
// ============================================================

import { motion } from 'framer-motion';
import { Card as CardType, Suit } from '@/lib/types';

interface CardProps {
  card?: CardType | null;
  faceDown?: boolean;
  small?: boolean;
  highlight?: boolean;
  delay?: number;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const RANK_DISPLAY: Record<string, string> = {
  'T': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
  'A': 'A',
};

function isRedSuit(suit: Suit): boolean {
  return suit === 'h' || suit === 'd';
}

export default function Card({
  card,
  faceDown = false,
  small = false,
  highlight = false,
  delay = 0,
}: CardProps) {
  const baseSize = small
    ? { width: 44, height: 62 }
    : { width: 60, height: 84 };

  if (faceDown || !card) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
        style={{
          ...baseSize,
          borderRadius: small ? 6 : 8,
          background: 'linear-gradient(135deg, #1e3a5f, #0f2744)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Card back pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: small ? 4 : 6,
            border: '1px solid rgba(59, 130, 246, 0.2)',
            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(59,130,246,0.05) 3px, rgba(59,130,246,0.05) 6px)',
          }}
        />
        <span style={{ fontSize: small ? 14 : 18, opacity: 0.4 }}>🃏</span>
      </motion.div>
    );
  }

  const rank = RANK_DISPLAY[card.rank] || card.rank;
  const suit = SUIT_SYMBOLS[card.suit];
  const isRed = isRedSuit(card.suit);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay }}
      style={{
        ...baseSize,
        borderRadius: small ? 6 : 8,
        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
        border: highlight
          ? '2px solid var(--accent-gold)'
          : '1px solid rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: highlight
          ? '0 0 16px rgba(240, 180, 41, 0.5), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        color: isRed ? '#dc2626' : '#1e293b',
        position: 'relative',
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      {/* Top-left rank & suit */}
      <div
        style={{
          position: 'absolute',
          top: small ? 2 : 4,
          left: small ? 3 : 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: small ? 10 : 13, fontWeight: 800 }}>{rank}</span>
        <span style={{ fontSize: small ? 8 : 11 }}>{suit}</span>
      </div>

      {/* Center suit */}
      <span style={{ fontSize: small ? 18 : 26, marginTop: small ? 2 : 4 }}>
        {suit}
      </span>

      {/* Bottom-right rank & suit (inverted) */}
      <div
        style={{
          position: 'absolute',
          bottom: small ? 2 : 4,
          right: small ? 3 : 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <span style={{ fontSize: small ? 10 : 13, fontWeight: 800 }}>{rank}</span>
        <span style={{ fontSize: small ? 8 : 11 }}>{suit}</span>
      </div>
    </motion.div>
  );
}
