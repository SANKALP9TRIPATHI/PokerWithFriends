'use client';

// ============================================================
// Poker Table Component
// ============================================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClientGameState } from '@/lib/types';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import BettingControls from './BettingControls';
import ResultsOverlay from './ResultsOverlay';
import ChatPanel from './ChatPanel';
import { ChatMessage, PlayerActionType } from '@/lib/types';

interface PokerTableProps {
  gameState: ClientGameState;
  playerId: string;
  isHost: boolean;
  turnTimeLeft: number | null;
  turnTimerMax: number;
  messages: ChatMessage[];
  onAction: (type: PlayerActionType, amount?: number) => void;
  onRestartGame: () => void;
  onLeave: () => void;
  onSendChat: (text: string) => void;
}

// Seat positions around an elliptical table — responsive percentages
// Positions are [left%, top%] for up to 10 seats
const SEAT_POSITIONS_MAP: Record<number, [number, number][]> = {
  2: [
    [50, 95], // bottom center (me)
    [50, 0],  // top center
  ],
  3: [
    [50, 95],
    [10, 35],
    [90, 35],
  ],
  4: [
    [50, 95],
    [5, 50],
    [50, 0],
    [95, 50],
  ],
  5: [
    [50, 95],
    [5, 65],
    [15, 5],
    [85, 5],
    [95, 65],
  ],
  6: [
    [50, 95],
    [5, 65],
    [10, 10],
    [50, 0],
    [90, 10],
    [95, 65],
  ],
  7: [
    [50, 95],
    [5, 70],
    [5, 25],
    [30, 0],
    [70, 0],
    [95, 25],
    [95, 70],
  ],
  8: [
    [50, 95],
    [10, 80],
    [2, 45],
    [10, 10],
    [40, 0],
    [60, 0],
    [90, 10],
    [98, 45],
  ],
  9: [
    [50, 95],
    [10, 80],
    [2, 45],
    [10, 10],
    [35, 0],
    [65, 0],
    [90, 10],
    [98, 45],
    [90, 80],
  ],
  10: [
    [50, 95],
    [10, 82],
    [2, 55],
    [2, 25],
    [20, 0],
    [50, 0],
    [80, 0],
    [98, 25],
    [98, 55],
    [90, 82],
  ],
};

function getSeatPositions(playerCount: number): [number, number][] {
  const clamped = Math.max(2, Math.min(10, playerCount));
  return SEAT_POSITIONS_MAP[clamped] || SEAT_POSITIONS_MAP[6];
}

export default function PokerTable({
  gameState,
  playerId,
  isHost,
  turnTimeLeft,
  turnTimerMax,
  messages,
  onAction,
  onRestartGame,
  onLeave,
  onSendChat,
}: PokerTableProps) {
  const [chatOpen, setChatOpen] = useState(false);

  const players = gameState.players;
  const positions = getSeatPositions(Math.max(players.length, 2));

  // Sort players so current player is at bottom
  const sortedPlayers = useMemo(() => {
    const myIndex = players.findIndex((p) => p.id === playerId);
    if (myIndex === -1) return players;
    const reordered = [
      ...players.slice(myIndex),
      ...players.slice(0, myIndex),
    ];
    return reordered;
  }, [players, playerId]);

  const isShowdown = gameState.phase === 'showdown';
  const currentTurnPlayerId =
    gameState.currentPlayerIndex >= 0
      ? gameState.players[gameState.currentPlayerIndex]?.id
      : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        padding: '10px',
      }}
    >
      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 16px',
          borderRadius: 20,
          zIndex: 20,
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 600,
        }}
        className="glass"
      >
        <span style={{ color: 'var(--accent-gold)' }}>
          Hand #{gameState.handNumber}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {gameState.phase}
        </span>
      </div>

      {/* Table container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          aspectRatio: '16/10',
          margin: 'auto',
        }}
      >
        {/* Table felt (ellipse) */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: '80%',
            height: '70%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, #22764a 0%, #1a5c3a 40%, #0f3d26 100%)',
            border: '8px solid #3d2314',
            boxShadow: `
              0 0 0 12px #5a3820,
              0 0 0 14px rgba(0,0,0,0.3),
              inset 0 0 60px rgba(0,0,0,0.3),
              0 20px 60px rgba(0,0,0,0.5)
            `,
          }}
        >
          {/* Table inner line */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '6%',
              width: '88%',
              height: '84%',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>

        {/* Center content: community cards + pot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
          }}
        >
          <PotDisplay pots={gameState.pots} />
          {gameState.phase !== 'waiting' && gameState.phase !== 'preflop' && (
            <CommunityCards cards={gameState.communityCards} />
          )}
          {(gameState.phase === 'waiting' || gameState.phase === 'preflop') &&
            gameState.communityCards.length === 0 && (
              <CommunityCards cards={[]} />
            )}
        </div>

        {/* Player seats */}
        {sortedPlayers.map((player, i) => {
          const pos = positions[i] || [50, 50];
          return (
            <div
              key={player.id}
              style={{
                position: 'absolute',
                left: `${pos[0]}%`,
                top: `${pos[1]}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
              }}
            >
              <PlayerSeat
                player={player}
                isCurrentTurn={currentTurnPlayerId === player.id}
                isMe={player.id === playerId}
                isDealer={player.seatIndex === gameState.dealerIndex}
                isSmallBlind={player.seatIndex === gameState.smallBlindIndex}
                isBigBlind={player.seatIndex === gameState.bigBlindIndex}
                turnTimeLeft={
                  currentTurnPlayerId === player.id ? turnTimeLeft : null
                }
                turnTimerMax={turnTimerMax}
              />
            </div>
          );
        })}

        {/* Results overlay */}
        {isShowdown && gameState.winners.length > 0 && (
          <ResultsOverlay
            winners={gameState.winners}
            players={gameState.players}
            isHost={isHost}
            onPlayAgain={onRestartGame}
            onLeave={onLeave}
          />
        )}
      </div>

      {/* Betting controls */}
      {!isShowdown && gameState.phase !== 'waiting' && (
        <div style={{ width: '100%', maxWidth: 520, marginTop: 8 }}>
          <BettingControls
            gameState={gameState}
            playerId={playerId}
            onAction={onAction}
          />
        </div>
      )}

      {/* Chat */}
      <ChatPanel
        messages={messages}
        onSend={onSendChat}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
}
