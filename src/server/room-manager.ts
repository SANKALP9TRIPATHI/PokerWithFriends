// ============================================================
// Vasu-Juari Poker — Room Manager
// ============================================================

import {
  Room,
  RoomConfig,
  DEFAULT_ROOM_CONFIG,
  ClientRoom,
  PlayerActionType,
} from '@/lib/types';
import {
  createInitialGameState,
  addPlayer,
  removePlayer,
  getClientGameState,
  startHand,
  handlePlayerAction,
} from './poker-engine';

// In-memory room storage
const rooms = new Map<string, Room>();

// Room code generation
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

// ---- Room CRUD ----

export function createRoom(
  hostId: string,
  hostNickname: string,
  config?: Partial<RoomConfig>
): Room {
  const roomConfig = { ...DEFAULT_ROOM_CONFIG, ...config };
  const code = generateRoomCode();

  let gameState = createInitialGameState();
  gameState = addPlayer(gameState, hostId, hostNickname, roomConfig.startingChips, true);

  const room: Room = {
    code,
    hostId,
    config: roomConfig,
    gameState,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(
  code: string,
  playerId: string,
  nickname: string
): { room: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { room: undefined as any, error: 'Room not found' };

  // Check if player is already in room (reconnect)
  const existingPlayer = room.gameState.players.find((p) => p.id === playerId);
  if (existingPlayer) {
    existingPlayer.isConnected = true;
    room.lastActivityAt = Date.now();
    return { room };
  }

  // Check if room is full
  if (room.gameState.players.length >= room.config.maxPlayers) {
    return { room, error: 'Room is full' };
  }

  // Check if game is in progress
  if (room.gameState.phase !== 'waiting' && room.gameState.phase !== 'showdown') {
    return { room, error: 'Game is in progress. Wait for the next hand.' };
  }

  // Check for duplicate nickname
  const duplicateName = room.gameState.players.find(
    (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
  );
  if (duplicateName) {
    return { room, error: 'Nickname already taken in this room' };
  }

  room.gameState = addPlayer(
    room.gameState,
    playerId,
    nickname,
    room.config.startingChips,
    false
  );
  room.lastActivityAt = Date.now();

  return { room };
}

export function leaveRoom(
  code: string,
  playerId: string
): { room: Room | undefined; wasHost: boolean; newHostId?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { room: undefined, wasHost: false };

  const wasHost = room.hostId === playerId;

  room.gameState = removePlayer(room.gameState, playerId);
  room.lastActivityAt = Date.now();

  // If room is empty, destroy it
  if (room.gameState.players.length === 0) {
    rooms.delete(code.toUpperCase());
    return { room: undefined, wasHost };
  }

  // Transfer host if needed
  let newHostId: string | undefined;
  if (wasHost && room.gameState.players.length > 0) {
    newHostId = room.gameState.players[0].id;
    room.hostId = newHostId;
    room.gameState.players[0].isHost = true;
  }

  return { room, wasHost, newHostId };
}

export function kickPlayer(
  code: string,
  hostId: string,
  targetPlayerId: string
): { success: boolean; room?: Room } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false };
  if (room.hostId !== hostId) return { success: false };
  if (hostId === targetPlayerId) return { success: false };

  room.gameState = removePlayer(room.gameState, targetPlayerId);
  room.lastActivityAt = Date.now();
  return { success: true, room };
}

// ---- Game Actions ----

export function startGame(
  code: string,
  hostId: string
): { success: boolean; room?: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== hostId) return { success: false, error: 'Only the host can start the game' };

  const activePlayers = room.gameState.players.filter(
    (p) => p.chips > 0 && p.isConnected
  );
  if (activePlayers.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' };
  }

  room.gameState = startHand(room.gameState, room.config);
  room.lastActivityAt = Date.now();
  return { success: true, room };
}

export function performAction(
  code: string,
  playerId: string,
  actionType: PlayerActionType,
  amount?: number
): { success: boolean; room?: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false, error: 'Room not found' };

  const prevPhase = room.gameState.phase;
  room.gameState = handlePlayerAction(
    room.gameState,
    playerId,
    actionType,
    amount,
    room.config
  );
  room.lastActivityAt = Date.now();

  return { success: true, room };
}

export function restartGame(
  code: string,
  hostId: string
): { success: boolean; room?: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false, error: 'Room not found' };
  if (room.hostId !== hostId) {
    return { success: false, error: 'Only the host can restart' };
  }

  room.gameState = startHand(room.gameState, room.config);
  room.lastActivityAt = Date.now();
  return { success: true, room };
}

export function changeBlinds(
  code: string,
  hostId: string,
  smallBlind: number,
  bigBlind: number
): { success: boolean; room?: Room } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false };
  if (room.hostId !== hostId) return { success: false };

  room.config.smallBlind = smallBlind;
  room.config.bigBlind = bigBlind;
  room.lastActivityAt = Date.now();
  return { success: true, room };
}

export function disconnectPlayer(code: string, playerId: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  const player = room.gameState.players.find((p) => p.id === playerId);
  if (player) {
    player.isConnected = false;
    // If it's their turn, auto-fold
    if (
      room.gameState.players[room.gameState.currentPlayerIndex]?.id === playerId &&
      room.gameState.phase !== 'waiting' &&
      room.gameState.phase !== 'showdown'
    ) {
      room.gameState = handlePlayerAction(
        room.gameState,
        playerId,
        'fold',
        undefined,
        room.config
      );
    }
  }

  room.lastActivityAt = Date.now();
  return room;
}

export function reconnectPlayer(
  code: string,
  playerId: string
): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;

  const player = room.gameState.players.find((p) => p.id === playerId);
  if (player) {
    player.isConnected = true;
  }

  return room;
}

// ---- Get Client Room ----

export function getClientRoom(room: Room, playerId: string): ClientRoom {
  return {
    code: room.code,
    hostId: room.hostId,
    config: room.config,
    gameState: getClientGameState(room.gameState, playerId),
  };
}

// ---- Cleanup ----

export function cleanupInactiveRooms(): void {
  const now = Date.now();
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivityAt > INACTIVITY_TIMEOUT) {
      rooms.delete(code);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupInactiveRooms, 60 * 1000);

// ---- Debug ----

export function getRoomCount(): number {
  return rooms.size;
}

export function getAllRoomCodes(): string[] {
  return Array.from(rooms.keys());
}
