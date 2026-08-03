// ============================================================
// Vasu-Juari Poker — Socket.IO Event Handler
// ============================================================

import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  ChatMessage,
  PlayerActionType,
} from '@/lib/types';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  performAction,
  restartGame,
  kickPlayer,
  changeBlinds,
  disconnectPlayer,
  reconnectPlayer,
  getClientRoom,
  getRoom,
} from './room-manager';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Track which room each socket is in
const socketRooms = new Map<string, string>(); // socketId -> roomCode
const socketPlayers = new Map<string, string>(); // socketId -> playerId

// Turn timers
const turnTimers = new Map<string, NodeJS.Timeout>();

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ---- Create Room ----
    socket.on('create-room', ({ nickname, config }) => {
      const playerId = socket.id;
      const room = createRoom(playerId, nickname, config);

      socket.join(room.code);
      socketRooms.set(socket.id, room.code);
      socketPlayers.set(socket.id, playerId);

      socket.emit('room-created', { roomCode: room.code });
      socket.emit('room-joined', { room: getClientRoom(room, playerId) });

      console.log(`[Room] Created: ${room.code} by ${nickname}`);
    });

    // ---- Join Room ----
    socket.on('join-room', ({ roomCode, nickname }) => {
      const playerId = socket.id;
      const { room, error } = joinRoom(roomCode, playerId, nickname);

      if (error) {
        socket.emit('room-error', { message: error });
        return;
      }

      socket.join(roomCode.toUpperCase());
      socketRooms.set(socket.id, roomCode.toUpperCase());
      socketPlayers.set(socket.id, playerId);

      // Send full state to joining player
      socket.emit('room-joined', { room: getClientRoom(room, playerId) });

      // Notify others
      const player = room.gameState.players.find((p) => p.id === playerId);
      if (player) {
        socket.to(roomCode.toUpperCase()).emit('player-joined', {
          player: {
            id: player.id,
            nickname: player.nickname,
            chips: player.chips,
            bet: player.bet,
            totalBet: player.totalBet,
            holeCards: null,
            status: player.status,
            seatIndex: player.seatIndex,
            isHost: player.isHost,
            isConnected: player.isConnected,
            hasActed: player.hasActed,
          },
        });
      }

      // Broadcast updated state to all
      broadcastGameState(io, room.code);

      console.log(`[Room] ${nickname} joined ${roomCode}`);
    });

    // ---- Leave Room ----
    socket.on('leave-room', () => {
      handlePlayerLeave(io, socket);
    });

    // ---- Start Game ----
    socket.on('start-game', () => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const playerId = socketPlayers.get(socket.id) || socket.id;
      const { success, room, error } = startGame(roomCode, playerId);

      if (!success || !room) {
        socket.emit('room-error', { message: error || 'Failed to start game' });
        return;
      }

      // Broadcast personalized state to each player
      broadcastGameState(io, roomCode);

      // Start turn timer
      startTurnTimer(io, roomCode, room.config.turnTimerSeconds);

      // Broadcast toast
      io.to(roomCode).emit('toast', {
        message: `Hand #${room.gameState.handNumber} started!`,
        type: 'info',
      });

      console.log(`[Game] Started in room ${roomCode}`);
    });

    // ---- Player Action ----
    socket.on('player-action', ({ type, amount }) => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const playerId = socketPlayers.get(socket.id) || socket.id;
      const room = getRoom(roomCode);
      if (!room) return;

      // Get player nickname for toast
      const player = room.gameState.players.find((p) => p.id === playerId);
      const nickname = player?.nickname || 'Unknown';

      const { success, error } = performAction(
        roomCode,
        playerId,
        type as PlayerActionType,
        amount
      );

      if (!success) {
        socket.emit('room-error', { message: error || 'Invalid action' });
        return;
      }

      const updatedRoom = getRoom(roomCode);
      if (!updatedRoom) return;

      // Clear existing timer
      clearTurnTimer(roomCode);

      // Broadcast updated state
      broadcastGameState(io, roomCode);

      // Generate action toast
      const actionText = getActionText(type as PlayerActionType, amount);
      io.to(roomCode).emit('toast', {
        message: `${nickname} ${actionText}`,
        type: 'info',
      });

      // Check for showdown
      if (updatedRoom.gameState.phase === 'showdown') {
        io.to(roomCode).emit('winner-announcement', {
          winners: updatedRoom.gameState.winners,
        });
      } else {
        // Start timer for next player
        startTurnTimer(io, roomCode, updatedRoom.config.turnTimerSeconds);
      }
    });

    // ---- Restart Game ----
    socket.on('restart-game', () => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const playerId = socketPlayers.get(socket.id) || socket.id;
      const { success, room, error } = restartGame(roomCode, playerId);

      if (!success || !room) {
        socket.emit('room-error', { message: error || 'Failed to restart' });
        return;
      }

      broadcastGameState(io, roomCode);
      startTurnTimer(io, roomCode, room.config.turnTimerSeconds);

      io.to(roomCode).emit('toast', {
        message: `Hand #${room.gameState.handNumber} started!`,
        type: 'info',
      });
    });

    // ---- Kick Player ----
    socket.on('kick-player', ({ playerId: targetId }) => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const hostId = socketPlayers.get(socket.id) || socket.id;
      const targetPlayer = getRoom(roomCode)?.gameState.players.find(
        (p) => p.id === targetId
      );

      const { success, room } = kickPlayer(roomCode, hostId, targetId);
      if (!success) return;

      // Notify the kicked player
      const targetSocket = findSocketByPlayerId(io, targetId);
      if (targetSocket) {
        targetSocket.emit('you-were-kicked');
        targetSocket.leave(roomCode);
        socketRooms.delete(targetSocket.id);
        socketPlayers.delete(targetSocket.id);
      }

      // Notify room
      io.to(roomCode).emit('player-kicked', {
        playerId: targetId,
        nickname: targetPlayer?.nickname || 'Unknown',
      });

      broadcastGameState(io, roomCode);
    });

    // ---- Change Blinds ----
    socket.on('change-blinds', ({ smallBlind, bigBlind }) => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const hostId = socketPlayers.get(socket.id) || socket.id;
      const { success, room } = changeBlinds(roomCode, hostId, smallBlind, bigBlind);

      if (success && room) {
        broadcastGameState(io, roomCode);
        io.to(roomCode).emit('toast', {
          message: `Blinds changed to ${smallBlind}/${bigBlind}`,
          type: 'info',
        });
      }
    });

    // ---- Chat ----
    socket.on('send-chat', ({ text }) => {
      const roomCode = socketRooms.get(socket.id);
      if (!roomCode) return;

      const playerId = socketPlayers.get(socket.id) || socket.id;
      const room = getRoom(roomCode);
      if (!room) return;

      const player = room.gameState.players.find((p) => p.id === playerId);
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        playerId,
        nickname: player?.nickname || 'Unknown',
        text: text.slice(0, 200), // Limit message length
        timestamp: Date.now(),
        isSystem: false,
      };

      io.to(roomCode).emit('chat-message', message);
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
      handlePlayerLeave(io, socket, true);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

// ---- Helper Functions ----

function handlePlayerLeave(
  io: TypedServer,
  socket: TypedSocket,
  isDisconnect = false
): void {
  const roomCode = socketRooms.get(socket.id);
  if (!roomCode) return;

  const playerId = socketPlayers.get(socket.id) || socket.id;

  if (isDisconnect) {
    // Mark as disconnected, don't remove immediately
    const room = disconnectPlayer(roomCode, playerId);
    if (room) {
      broadcastGameState(io, roomCode);

      const player = room.gameState.players.find((p) => p.id === playerId);
      io.to(roomCode).emit('toast', {
        message: `${player?.nickname || 'A player'} disconnected`,
        type: 'warning',
      });

      // Remove after timeout if not reconnected
      setTimeout(() => {
        const currentRoom = getRoom(roomCode);
        if (!currentRoom) return;
        const p = currentRoom.gameState.players.find((pl) => pl.id === playerId);
        if (p && !p.isConnected) {
          const { room: updatedRoom, wasHost, newHostId } = leaveRoom(roomCode, playerId);
          if (updatedRoom) {
            if (wasHost && newHostId) {
              io.to(roomCode).emit('host-changed', { newHostId });
            }
            broadcastGameState(io, roomCode);
          }
        }
      }, 30000); // 30 second grace period
    }
  } else {
    const room = getRoom(roomCode);
    const player = room?.gameState.players.find((p) => p.id === playerId);

    const { room: updatedRoom, wasHost, newHostId } = leaveRoom(
      roomCode,
      playerId
    );

    socket.leave(roomCode);
    socketRooms.delete(socket.id);
    socketPlayers.delete(socket.id);

    if (updatedRoom) {
      io.to(roomCode).emit('player-left', {
        playerId,
        nickname: player?.nickname || 'Unknown',
      });

      if (wasHost && newHostId) {
        io.to(roomCode).emit('host-changed', { newHostId });
      }

      broadcastGameState(io, roomCode);
    }
  }
}

function broadcastGameState(io: TypedServer, roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  // Send personalized state to each player
  const sockets = io.sockets.adapter.rooms.get(roomCode);
  if (!sockets) return;

  for (const socketId of sockets) {
    const playerId = socketPlayers.get(socketId) || socketId;
    const clientRoom = getClientRoom(room, playerId);
    io.to(socketId).emit('game-state-update', {
      gameState: clientRoom.gameState,
    });
  }
}

function startTurnTimer(
  io: TypedServer,
  roomCode: string,
  seconds: number
): void {
  clearTurnTimer(roomCode);

  const room = getRoom(roomCode);
  if (!room || room.gameState.currentPlayerIndex === -1) return;

  const currentPlayer =
    room.gameState.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer) return;

  let timeLeft = seconds;

  const interval = setInterval(() => {
    timeLeft--;

    io.to(roomCode).emit('turn-timer', {
      playerId: currentPlayer.id,
      timeLeft,
    });

    if (timeLeft <= 0) {
      clearInterval(interval);
      turnTimers.delete(roomCode);

      // Auto-fold
      const currentRoom = getRoom(roomCode);
      if (
        currentRoom &&
        currentRoom.gameState.players[currentRoom.gameState.currentPlayerIndex]
          ?.id === currentPlayer.id
      ) {
        performAction(roomCode, currentPlayer.id, 'fold');
        broadcastGameState(io, roomCode);

        io.to(roomCode).emit('toast', {
          message: `${currentPlayer.nickname} timed out and folded`,
          type: 'warning',
        });

        const updatedRoom = getRoom(roomCode);
        if (updatedRoom && updatedRoom.gameState.phase === 'showdown') {
          io.to(roomCode).emit('winner-announcement', {
            winners: updatedRoom.gameState.winners,
          });
        } else if (updatedRoom) {
          startTurnTimer(io, roomCode, seconds);
        }
      }
    }
  }, 1000);

  turnTimers.set(roomCode, interval);
}

function clearTurnTimer(roomCode: string): void {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearInterval(timer);
    turnTimers.delete(roomCode);
  }
}

function findSocketByPlayerId(
  io: TypedServer,
  playerId: string
): TypedSocket | undefined {
  for (const [socketId, pId] of socketPlayers.entries()) {
    if (pId === playerId) {
      return io.sockets.sockets.get(socketId) as TypedSocket | undefined;
    }
  }
  return undefined;
}

function getActionText(type: PlayerActionType, amount?: number): string {
  switch (type) {
    case 'fold':
      return 'folded';
    case 'check':
      return 'checked';
    case 'call':
      return `called${amount ? ` ${amount}` : ''}`;
    case 'bet':
      return `bet ${amount || 0}`;
    case 'raise':
      return `raised to ${amount || 0}`;
    case 'allIn':
      return 'went ALL IN!';
    default:
      return type;
  }
}
