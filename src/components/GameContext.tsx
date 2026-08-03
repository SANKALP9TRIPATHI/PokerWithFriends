'use client';

// ============================================================
// Vasu-Juari Poker — Game Context
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  ClientGameState,
  ClientRoom,
  ClientPlayer,
  ChatMessage,
  WinnerInfo,
  RoomConfig,
  PlayerActionType,
} from '@/lib/types';
import { useSocket, ConnectionStatus } from '@/hooks/useSocket';

interface GameContextType {
  // Connection
  connectionStatus: ConnectionStatus;
  playerId: string | null;

  // Room state
  roomCode: string | null;
  room: ClientRoom | null;
  gameState: ClientGameState | null;
  isHost: boolean;

  // Player identity
  nickname: string | null;
  myPlayer: ClientPlayer | null;

  // Chat
  messages: ChatMessage[];

  // Turn timer
  turnTimeLeft: number | null;
  turnPlayerId: string | null;

  // Actions
  createRoom: (nickname: string, config?: Partial<RoomConfig>) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  restartGame: () => void;
  performAction: (type: PlayerActionType, amount?: number) => void;
  kickPlayer: (playerId: string) => void;
  changeBlinds: (smallBlind: number, bigBlind: number) => void;
  sendChat: (text: string) => void;

  // Error
  error: string | null;
  clearError: () => void;

  // Toast
  toasts: ToastMessage[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { emit, on, status: connectionStatus, id: socketId } = useSocket();

  // State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<ClientRoom | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number | null>(null);
  const [turnPlayerId, setTurnPlayerId] = useState<string | null>(null);

  const playerId = socketId || null;

  // Derived state
  const isHost = room ? room.hostId === playerId : false;
  const myPlayer =
    gameState?.players.find((p) => p.id === playerId) || null;

  // Setup event listeners
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cleanups.push(
      on('room-created', ({ roomCode: code }) => {
        setRoomCode(code);
      })
    );

    cleanups.push(
      on('room-joined', ({ room: r }) => {
        setRoom(r);
        setRoomCode(r.code);
        setGameState(r.gameState);
      })
    );

    cleanups.push(
      on('game-state-update', ({ gameState: gs }) => {
        setGameState(gs);
        // Also update room's gameState
        setRoom((prev) => (prev ? { ...prev, gameState: gs } : null));
      })
    );

    cleanups.push(
      on('room-error', ({ message }) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
      })
    );

    cleanups.push(
      on('player-joined', ({ player }) => {
        addToast(`${player.nickname} joined the room`, 'info');
      })
    );

    cleanups.push(
      on('player-left', ({ nickname: name }) => {
        addToast(`${name} left the room`, 'warning');
      })
    );

    cleanups.push(
      on('winner-announcement', ({ winners }) => {
        for (const w of winners) {
          const player = gameState?.players.find((p) => p.id === w.playerId);
          addToast(
            `🏆 ${player?.nickname || 'Winner'} wins ${w.potAmount} chips — ${w.handDescription}`,
            'success'
          );
        }
      })
    );

    cleanups.push(
      on('chat-message', (msg) => {
        setMessages((prev) => [...prev.slice(-100), msg]);
      })
    );

    cleanups.push(
      on('you-were-kicked', () => {
        setRoom(null);
        setRoomCode(null);
        setGameState(null);
        setMessages([]);
        addToast('You were kicked from the room', 'error');
      })
    );

    cleanups.push(
      on('host-changed', ({ newHostId }) => {
        setRoom((prev) => (prev ? { ...prev, hostId: newHostId } : null));
      })
    );

    cleanups.push(
      on('turn-timer', ({ playerId: pid, timeLeft }) => {
        setTurnPlayerId(pid);
        setTurnTimeLeft(timeLeft);
      })
    );

    cleanups.push(
      on('toast', ({ message, type }) => {
        addToast(message, type);
      })
    );

    cleanups.push(
      on('player-kicked', ({ nickname: name }) => {
        addToast(`${name} was kicked`, 'warning');
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [on, gameState?.players]);

  // Auto-clear toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Actions
  const createRoom = useCallback(
    (nick: string, config?: Partial<RoomConfig>) => {
      setNickname(nick);
      emit('create-room', { nickname: nick, config });
    },
    [emit]
  );

  const joinRoom = useCallback(
    (code: string, nick: string) => {
      setNickname(nick);
      emit('join-room', { roomCode: code, nickname: nick });
    },
    [emit]
  );

  const leaveRoom = useCallback(() => {
    emit('leave-room');
    setRoom(null);
    setRoomCode(null);
    setGameState(null);
    setMessages([]);
  }, [emit]);

  const startGame = useCallback(() => {
    emit('start-game');
  }, [emit]);

  const restartGame = useCallback(() => {
    emit('restart-game');
  }, [emit]);

  const performAction = useCallback(
    (type: PlayerActionType, amount?: number) => {
      emit('player-action', { type, amount });
    },
    [emit]
  );

  const kickPlayer = useCallback(
    (targetId: string) => {
      emit('kick-player', { playerId: targetId });
    },
    [emit]
  );

  const changeBlinds = useCallback(
    (smallBlind: number, bigBlind: number) => {
      emit('change-blinds', { smallBlind, bigBlind });
    },
    [emit]
  );

  const sendChat = useCallback(
    (text: string) => {
      emit('send-chat', { text });
    },
    [emit]
  );

  const clearError = useCallback(() => setError(null), []);

  const addToast = (message: string, type: ToastMessage['type']) => {
    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message,
        type,
        timestamp: Date.now(),
      },
    ]);
  };

  const value: GameContextType = {
    connectionStatus,
    playerId,
    roomCode,
    room,
    gameState,
    isHost,
    nickname,
    myPlayer,
    messages,
    turnTimeLeft,
    turnPlayerId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    restartGame,
    performAction,
    kickPlayer,
    changeBlinds,
    sendChat,
    error,
    clearError,
    toasts,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}
