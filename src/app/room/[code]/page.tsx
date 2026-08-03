'use client';

// ============================================================
// Room Page — Handles both lobby and game states
// ============================================================

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GameProvider, useGame } from '@/components/GameContext';
import ToastContainer from '@/components/Toast';
import Lobby from '@/components/Lobby';
import PokerTable from '@/components/PokerTable';

function RoomContent() {
  const router = useRouter();
  const params = useParams();
  const roomCode = (params.code as string)?.toUpperCase();

  const {
    connectionStatus,
    playerId,
    gameState,
    room,
    isHost,
    roomCode: connectedRoomCode,
    messages,
    toasts,
    error,
    turnTimeLeft,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    restartGame,
    performAction,
    kickPlayer,
    changeBlinds,
    sendChat,
  } = useGame();

  const [hasJoined, setHasJoined] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [showNicknameForm, setShowNicknameForm] = useState(false);

  // Get stored nickname from session
  useEffect(() => {
    const stored = sessionStorage.getItem('vj-nickname');
    if (stored) {
      setNickname(stored);
    }
  }, []);

  // Auto-join/create when connected
  useEffect(() => {
    if (connectionStatus !== 'connected' || hasJoined || !playerId) return;

    const action = sessionStorage.getItem('vj-action');
    const storedNickname = sessionStorage.getItem('vj-nickname');

    if (!storedNickname) {
      setShowNicknameForm(true);
      return;
    }

    if (roomCode === 'new' || action === 'create') {
      createRoom(storedNickname);
      setHasJoined(true);
      sessionStorage.removeItem('vj-action');
    } else if (roomCode) {
      joinRoom(roomCode, storedNickname);
      setHasJoined(true);
      sessionStorage.removeItem('vj-action');
    }
  }, [connectionStatus, hasJoined, playerId, roomCode, createRoom, joinRoom]);

  // Redirect after room creation
  useEffect(() => {
    if (connectedRoomCode && roomCode === 'new') {
      router.replace(`/room/${connectedRoomCode}`);
    }
  }, [connectedRoomCode, roomCode, router]);

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  const handleNicknameSubmit = () => {
    if (!nicknameInput.trim()) return;
    sessionStorage.setItem('vj-nickname', nicknameInput.trim());
    setNickname(nicknameInput.trim());
    setShowNicknameForm(false);

    if (roomCode === 'new') {
      sessionStorage.setItem('vj-action', 'create');
    }
    // Trigger the join effect
    setHasJoined(false);
  };

  // Connection screen
  if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40 }}
        >
          🃏
        </motion.div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            color: 'var(--text-secondary)',
          }}
        >
          {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Connecting to server...'}
        </span>
      </div>
    );
  }

  // Disconnected
  if (connectionStatus === 'disconnected') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 40 }}>⚠️</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--error)',
            fontWeight: 600,
          }}
        >
          Disconnected from server
        </span>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reconnect
        </button>
      </div>
    );
  }

  // Nickname form
  if (showNicknameForm) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 28,
            borderRadius: 16,
            maxWidth: 360,
            width: '100%',
          }}
          className="glass"
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Enter Your Nickname
          </h2>
          <input
            className="input"
            placeholder="Your nickname"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
            maxLength={20}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleNicknameSubmit}
            disabled={!nicknameInput.trim()}
          >
            {roomCode === 'new' ? 'Create Room' : 'Join Room'}
          </button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !gameState) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 40 }}>❌</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--error)',
            fontWeight: 600,
          }}
        >
          {error}
        </span>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  // Loading state
  if (!gameState || !room) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40 }}
        >
          🃏
        </motion.div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            color: 'var(--text-secondary)',
          }}
        >
          Loading room...
        </span>
      </div>
    );
  }

  // Lobby vs Game
  const isWaiting = gameState.phase === 'waiting';

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ToastContainer toasts={toasts} />

      {isWaiting ? (
        <Lobby
          roomCode={connectedRoomCode || roomCode}
          gameState={gameState}
          config={room.config}
          isHost={isHost}
          onStartGame={startGame}
          onLeave={handleLeave}
          onChangeBlinds={changeBlinds}
          onKickPlayer={kickPlayer}
        />
      ) : (
        <PokerTable
          gameState={gameState}
          playerId={playerId || ''}
          isHost={isHost}
          turnTimeLeft={turnTimeLeft}
          turnTimerMax={room.config.turnTimerSeconds}
          messages={messages}
          onAction={performAction}
          onRestartGame={restartGame}
          onLeave={handleLeave}
          onSendChat={sendChat}
        />
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <GameProvider>
      <RoomContent />
    </GameProvider>
  );
}
