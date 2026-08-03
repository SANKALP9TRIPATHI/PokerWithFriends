'use client';

// ============================================================
// Betting Controls Component
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientGameState, PlayerActionType } from '@/lib/types';

interface BettingControlsProps {
  gameState: ClientGameState;
  playerId: string;
  onAction: (type: PlayerActionType, amount?: number) => void;
}

export default function BettingControls({
  gameState,
  playerId,
  onAction,
}: BettingControlsProps) {
  const myPlayer = gameState.players.find((p) => p.id === playerId);
  const isMyTurn =
    gameState.players[gameState.currentPlayerIndex]?.id === playerId;

  const [raiseAmount, setRaiseAmount] = useState(0);

  // Calculate valid actions
  const validActions = useMemo(() => {
    if (!myPlayer || myPlayer.status !== 'active' || !isMyTurn) return [];
    const actions: PlayerActionType[] = ['fold'];

    if (myPlayer.bet >= gameState.currentBet) actions.push('check');
    if (gameState.currentBet > myPlayer.bet) actions.push('call');
    if (myPlayer.chips > 0) {
      if (gameState.currentBet === 0) actions.push('bet');
      else if (myPlayer.chips + myPlayer.bet > gameState.currentBet) actions.push('raise');
    }
    if (myPlayer.chips > 0) actions.push('allIn');

    return actions;
  }, [myPlayer, isMyTurn, gameState.currentBet]);

  // Calculate amounts
  const callAmount = myPlayer
    ? Math.min(gameState.currentBet - myPlayer.bet, myPlayer.chips)
    : 0;
  const minRaiseTotal = gameState.currentBet + gameState.minRaise;
  const maxRaise = myPlayer ? myPlayer.chips + myPlayer.bet : 0;
  const potTotal = gameState.pots.reduce((s, p) => s + p.amount, 0);

  // Update raise slider default
  useEffect(() => {
    setRaiseAmount(Math.min(minRaiseTotal, maxRaise));
  }, [minRaiseTotal, maxRaise, isMyTurn]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isMyTurn) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key.toLowerCase()) {
        case 'f':
          if (validActions.includes('fold')) onAction('fold');
          break;
        case 'c':
          if (validActions.includes('call')) onAction('call');
          else if (validActions.includes('check')) onAction('check');
          break;
        case 'r':
          if (validActions.includes('raise')) onAction('raise', raiseAmount);
          else if (validActions.includes('bet')) onAction('bet', raiseAmount);
          break;
        case 'a':
          if (validActions.includes('allIn')) onAction('allIn');
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMyTurn, validActions, onAction, raiseAmount]);

  if (!isMyTurn || !myPlayer || myPlayer.status !== 'active') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 0',
          minHeight: 80,
        }}
      >
        {myPlayer && myPlayer.status === 'active' && (
          <span
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
            }}
          >
            Waiting for other players...
          </span>
        )}
      </div>
    );
  }

  const presetAmounts = [
    { label: 'Min', value: minRaiseTotal },
    { label: '½ Pot', value: Math.max(minRaiseTotal, Math.floor(potTotal / 2) + gameState.currentBet) },
    { label: '¾ Pot', value: Math.max(minRaiseTotal, Math.floor((potTotal * 3) / 4) + gameState.currentBet) },
    { label: 'Pot', value: Math.max(minRaiseTotal, potTotal + gameState.currentBet) },
  ].filter((p) => p.value <= maxRaise);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 16,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(240, 180, 41, 0.15)',
        maxWidth: 520,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Raise slider row */}
      {(validActions.includes('raise') || validActions.includes('bet')) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {presetAmounts.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setRaiseAmount(preset.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: raiseAmount === preset.value
                    ? '1px solid var(--accent-gold)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: raiseAmount === preset.value
                    ? 'rgba(240, 180, 41, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={minRaiseTotal}
              max={maxRaise}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--accent-gold)',
                height: 6,
              }}
            />
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || minRaiseTotal;
                setRaiseAmount(Math.max(minRaiseTotal, Math.min(val, maxRaise)));
              }}
              style={{
                width: 70,
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--accent-gold-light)',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {validActions.includes('fold') && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onAction('fold')}
            title="Fold (F)"
          >
            Fold
          </button>
        )}

        {validActions.includes('check') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onAction('check')}
            title="Check (C)"
          >
            Check
          </button>
        )}

        {validActions.includes('call') && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => onAction('call')}
            title="Call (C)"
          >
            Call {callAmount}
          </button>
        )}

        {validActions.includes('bet') && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAction('bet', raiseAmount)}
            title="Bet (R)"
          >
            Bet {raiseAmount}
          </button>
        )}

        {validActions.includes('raise') && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAction('raise', raiseAmount)}
            title="Raise (R)"
          >
            Raise {raiseAmount}
          </button>
        )}

        {validActions.includes('allIn') && (
          <button
            className="btn btn-sm"
            onClick={() => onAction('allIn')}
            title="All In (A)"
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #dc2626, #f59e0b)',
              color: 'white',
              fontWeight: 800,
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ALL IN ({myPlayer.chips})
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 10,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Shortcuts: F = Fold, C = Check/Call, R = Raise/Bet, A = All In
      </div>
    </motion.div>
  );
}
