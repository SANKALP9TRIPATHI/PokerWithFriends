'use client';

// ============================================================
// Results Overlay Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { WinnerInfo, ClientPlayer } from '@/lib/types';
import Card from './Card';

interface ResultsOverlayProps {
  winners: WinnerInfo[];
  players: ClientPlayer[];
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function ResultsOverlay({
  winners,
  players,
  isHost,
  onPlayAgain,
  onLeave,
}: ResultsOverlayProps) {
  if (winners.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          borderRadius: 'inherit',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: '32px 40px',
            borderRadius: 24,
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(240, 180, 41, 0.3)',
            boxShadow: '0 0 60px rgba(240, 180, 41, 0.15)',
            maxWidth: 420,
            width: '90%',
          }}
        >
          {/* Trophy animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4, stiffness: 200 }}
            style={{ fontSize: 52 }}
          >
            🏆
          </motion.div>

          {/* Winners */}
          {winners.map((winner, i) => {
            const player = players.find((p) => p.id === winner.playerId);
            return (
              <motion.div
                key={winner.playerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {player?.nickname || 'Winner'}
                </span>

                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {winner.handDescription}
                </span>

                {/* Winning cards */}
                {winner.cards.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {winner.cards.map((card, ci) => (
                      <Card key={ci} card={card} highlight delay={ci * 0.1} />
                    ))}
                  </div>
                )}

                {/* Pot won */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    borderRadius: 12,
                    background: 'rgba(240, 180, 41, 0.15)',
                    border: '1px solid rgba(240, 180, 41, 0.3)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🪙</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 18,
                      color: 'var(--accent-gold-light)',
                    }}
                  >
                    +{winner.potAmount.toLocaleString()}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
            }}
          >
            {isHost ? (
              <button className="btn btn-primary" onClick={onPlayAgain}>
                🃏 Next Hand
              </button>
            ) : (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Waiting for host to start next hand...
              </span>
            )}
            <button className="btn btn-secondary" onClick={onLeave}>
              Leave Table
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
