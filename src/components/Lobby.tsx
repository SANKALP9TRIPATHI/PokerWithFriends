'use client';

// ============================================================
// Lobby Component
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClientGameState, RoomConfig } from '@/lib/types';

interface LobbyProps {
  roomCode: string;
  gameState: ClientGameState;
  config: RoomConfig;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
  onChangeBlinds: (sb: number, bb: number) => void;
  onKickPlayer: (playerId: string) => void;
}

export default function Lobby({
  roomCode,
  gameState,
  config,
  isHost,
  onStartGame,
  onLeave,
  onChangeBlinds,
  onKickPlayer,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [editBlinds, setEditBlinds] = useState(false);
  const [sb, setSb] = useState(config.smallBlind);
  const [bb, setBb] = useState(config.bigBlind);

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomCode}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = gameState.players.filter(
    (p) => p.chips > 0 && p.isConnected
  ).length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '40px 20px',
        maxWidth: 500,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Room code */}
      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Room Code
        </span>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: 4,
          }}
        >
          {roomCode}
        </div>
      </div>

      {/* Invite link */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <input
          readOnly
          value={inviteLink}
          className="input"
          style={{
            fontSize: 13,
            background: 'rgba(0,0,0,0.3)',
          }}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={copyLink}
          style={{ whiteSpace: 'nowrap' }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* Player list */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          overflow: 'hidden',
        }}
        className="glass"
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Players ({gameState.players.length}/{config.maxPlayers})</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {config.startingChips} chips each
          </span>
        </div>

        {gameState.players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${
                  ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][i % 5]
                }, ${
                  ['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#fee140'][i % 5]
                })`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {player.nickname.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'var(--font-display)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.nickname}
                </span>
                {player.id === gameState.myPlayerId && (
                  <span style={{ fontSize: 11, color: 'var(--accent-gold)' }}>(You)</span>
                )}
                {player.isHost && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 6,
                      background: 'rgba(240, 180, 41, 0.2)',
                      color: 'var(--accent-gold)',
                      fontWeight: 700,
                    }}
                  >
                    HOST
                  </span>
                )}
              </div>
            </div>

            {/* Connection status */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: player.isConnected ? 'var(--success)' : 'var(--error)',
                boxShadow: player.isConnected
                  ? '0 0 6px rgba(34, 197, 94, 0.5)'
                  : '0 0 6px rgba(239, 68, 68, 0.5)',
              }}
            />

            {/* Kick button */}
            {isHost && player.id !== gameState.myPlayerId && (
              <button
                onClick={() => onKickPlayer(player.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 4,
                  borderRadius: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                title="Kick player"
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Blinds config */}
      {isHost && (
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 12,
            padding: 16,
          }}
          className="glass"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: editBlinds ? 12 : 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Blinds: {config.smallBlind}/{config.bigBlind}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditBlinds(!editBlinds)}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              {editBlinds ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editBlinds && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>SB</label>
                <input
                  type="number"
                  value={sb}
                  onChange={(e) => setSb(parseInt(e.target.value) || 1)}
                  className="input"
                  style={{ fontSize: 13, padding: '6px 10px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>BB</label>
                <input
                  type="number"
                  value={bb}
                  onChange={(e) => setBb(parseInt(e.target.value) || 2)}
                  className="input"
                  style={{ fontSize: 13, padding: '6px 10px' }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14, padding: '6px 12px' }}
                onClick={() => {
                  onChangeBlinds(sb, bb);
                  setEditBlinds(false);
                }}
              >
                Save
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        {isHost && (
          <button
            className="btn btn-primary btn-lg"
            onClick={onStartGame}
            disabled={!canStart}
          >
            🃏 Start Game
          </button>
        )}
        {!isHost && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
            }}
          >
            Waiting for host to start...
          </div>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave Room
        </button>
      </div>
    </motion.div>
  );
}
