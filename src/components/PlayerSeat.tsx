'use client';

// ============================================================
// Player Seat Component
// ============================================================

import { motion } from 'framer-motion';
import { ClientPlayer, PlayerAction } from '@/lib/types';
import Card from './Card';

interface PlayerSeatProps {
  player: ClientPlayer;
  isCurrentTurn: boolean;
  isMe: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'var(--success)';
    case 'folded': return 'var(--text-muted)';
    case 'allIn': return 'var(--accent-gold)';
    case 'disconnected': return 'var(--error)';
    default: return 'var(--text-secondary)';
  }
}

function getStatusLabel(player: ClientPlayer): string | null {
  if (player.status === 'folded') return 'FOLDED';
  if (player.status === 'allIn') return 'ALL IN';
  if (!player.isConnected) return 'OFFLINE';
  if (player.lastAction?.type === 'check') return 'CHECK';
  if (player.lastAction?.type === 'call') return `CALL ${player.lastAction.amount}`;
  if (player.lastAction?.type === 'bet') return `BET ${player.lastAction.amount}`;
  if (player.lastAction?.type === 'raise') return `RAISE ${player.lastAction.amount}`;
  return null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Gradient pairs for avatars
const AVATAR_GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#ffecd2', '#fcb69f'],
  ['#ff9a9e', '#fecfef'],
  ['#89f7fe', '#66a6ff'],
  ['#fddb92', '#d1fdff'],
];

export default function PlayerSeat({
  player,
  isCurrentTurn,
  isMe,
  isDealer,
  isSmallBlind,
  isBigBlind,
}: PlayerSeatProps) {
  const statusLabel = getStatusLabel(player);
  const isFolded = player.status === 'folded';
  const isDisconnected = !player.isConnected;
  const gradientPair = AVATAR_GRADIENTS[player.seatIndex % AVATAR_GRADIENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        opacity: isFolded || isDisconnected ? 0.5 : 1,
        transition: 'opacity 0.3s ease',
        position: 'relative',
        minWidth: 90,
      }}
    >
      {/* Bet display */}
      {player.bet > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: -24,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 10px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.5)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-gold-light)',
            fontFamily: 'var(--font-display)',
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 10 }}>🪙</span>
          {player.bet}
        </motion.div>
      )}

      {/* Avatar container with turn indicator */}
      <div style={{ position: 'relative' }}>
        {/* Turn ring */}
        {isCurrentTurn && (
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(240, 180, 41, 0.4)',
                '0 0 25px rgba(240, 180, 41, 0.7)',
                '0 0 10px rgba(240, 180, 41, 0.4)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid var(--accent-gold)',
              zIndex: 0,
            }}
          />
        )}

        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${gradientPair[0]}, ${gradientPair[1]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'var(--font-display)',
            border: isMe
              ? '2px solid var(--accent-gold)'
              : '2px solid rgba(255,255,255,0.15)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {getInitials(player.nickname)}
        </div>

        {/* Position badges */}
        {isDealer && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: -8,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f0b429, #f7d070)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 900,
              color: '#0a0e17',
              border: '2px solid var(--bg-primary)',
              zIndex: 2,
            }}
          >
            D
          </div>
        )}
        {isSmallBlind && !isDealer && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: -8,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: 'white',
              border: '2px solid var(--bg-primary)',
              zIndex: 2,
            }}
          >
            SB
          </div>
        )}
        {isBigBlind && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -8,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: 'white',
              border: '2px solid var(--bg-primary)',
              zIndex: 2,
            }}
          >
            BB
          </div>
        )}
      </div>

      {/* Name & chips */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: isMe ? 'var(--accent-gold-light)' : 'var(--text-primary)',
            maxWidth: 90,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.nickname}
          {isMe && ' (You)'}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          💰 {player.chips.toLocaleString()}
        </span>
      </div>

      {/* Status label */}
      {statusLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '2px 8px',
            borderRadius: 6,
            background:
              player.status === 'allIn'
                ? 'linear-gradient(135deg, var(--accent-gold-dark), var(--accent-gold))'
                : 'rgba(0,0,0,0.5)',
            fontSize: 10,
            fontWeight: 700,
            color: player.status === 'allIn' ? '#0a0e17' : getStatusColor(player.status),
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-display)',
          }}
        >
          {statusLabel}
        </motion.div>
      )}

      {/* Hole cards */}
      {(player.holeCards !== null || player.status === 'active' || player.status === 'allIn') &&
        player.status !== 'folded' &&
        player.status !== 'waiting' && (
          <div
            style={{
              display: 'flex',
              gap: 3,
              marginTop: 2,
            }}
          >
            {player.holeCards ? (
              player.holeCards.map((card, i) => (
                <Card key={i} card={card} small delay={i * 0.1} />
              ))
            ) : (
              <>
                <Card faceDown small delay={0} />
                <Card faceDown small delay={0.1} />
              </>
            )}
          </div>
        )}
    </motion.div>
  );
}
