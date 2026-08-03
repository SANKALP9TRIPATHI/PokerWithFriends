'use client';

// ============================================================
// Community Cards Component
// ============================================================

import { motion } from 'framer-motion';
import { Card as CardType } from '@/lib/types';
import Card from './Card';

interface CommunityCardsProps {
  cards: CardType[];
  winningCards?: CardType[];
}

export default function CommunityCards({ cards, winningCards = [] }: CommunityCardsProps) {
  const isWinningCard = (card: CardType) =>
    winningCards.some((wc) => wc.rank === card.rank && wc.suit === card.suit);

  // Fill empty slots up to 5
  const slots = Array.from({ length: 5 }, (_, i) => cards[i] || null);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 16px',
        borderRadius: 16,
        background: 'rgba(0, 0, 0, 0.2)',
        minHeight: 100,
      }}
    >
      {slots.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: card ? i * 0.15 : 0,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          {card ? (
            <Card
              card={card}
              highlight={isWinningCard(card)}
              delay={i * 0.1}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 84,
                borderRadius: 8,
                border: '2px dashed rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.15)',
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
