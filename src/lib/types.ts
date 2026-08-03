// ============================================================
// Vasu-Juari Poker — Shared Types
// ============================================================

// --- Card Types ---

export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUIT_NAMES: Record<Suit, string> = {
  h: 'Hearts',
  d: 'Diamonds',
  c: 'Clubs',
  s: 'Spades',
};

export const RANK_NAMES: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
  '7': '7', '8': '8', '9': '9', 'T': '10',
  'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace',
};

// --- Player Types ---

export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'allIn' | 'disconnected' | 'eliminated';

export interface Player {
  id: string;
  nickname: string;
  chips: number;
  bet: number;           // current bet in this round
  totalBet: number;      // total bet in this hand
  holeCards: Card[];
  status: PlayerStatus;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  hasActed: boolean;     // has acted this betting round
  lastAction?: PlayerAction;
}

export interface ClientPlayer {
  id: string;
  nickname: string;
  chips: number;
  bet: number;
  totalBet: number;
  holeCards: Card[] | null;  // null if hidden (other players' cards)
  status: PlayerStatus;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  hasActed: boolean;
  lastAction?: PlayerAction;
}

// --- Game Phase ---

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

// --- Player Actions ---

export type PlayerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allIn';

export interface PlayerAction {
  type: PlayerActionType;
  amount: number;
  timestamp: number;
}

// --- Pot ---

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

// --- Winner Info ---

export interface WinnerInfo {
  playerId: string;
  potAmount: number;
  handName: string;
  handDescription: string;
  cards: Card[];
}

// --- Game State (Server-side, full) ---

export interface GameState {
  deck: Card[];
  communityCards: Card[];
  players: Player[];
  pots: Pot[];
  phase: GamePhase;
  dealerIndex: number;
  currentPlayerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentBet: number;      // highest bet this round
  minRaise: number;        // minimum raise amount
  lastRaiseAmount: number;
  handNumber: number;
  winners: WinnerInfo[];
  lastAction?: { playerId: string; action: PlayerAction };
}

// --- Client Game State (sanitized, sent to specific player) ---

export interface ClientGameState {
  communityCards: Card[];
  players: ClientPlayer[];
  pots: Pot[];
  phase: GamePhase;
  dealerIndex: number;
  currentPlayerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentBet: number;
  minRaise: number;
  handNumber: number;
  winners: WinnerInfo[];
  myPlayerId: string;
  lastAction?: { playerId: string; action: PlayerAction };
}

// --- Room ---

export interface RoomConfig {
  smallBlind: number;
  bigBlind: number;
  startingChips: number;
  maxPlayers: number;
  turnTimerSeconds: number;
}

export interface Room {
  code: string;
  hostId: string;
  config: RoomConfig;
  gameState: GameState;
  createdAt: number;
  lastActivityAt: number;
}

export interface ClientRoom {
  code: string;
  hostId: string;
  config: RoomConfig;
  gameState: ClientGameState;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

// --- Socket Events ---

export interface ServerToClientEvents {
  'room-created': (data: { roomCode: string }) => void;
  'room-joined': (data: { room: ClientRoom }) => void;
  'room-error': (data: { message: string }) => void;
  'game-state-update': (data: { gameState: ClientGameState }) => void;
  'player-joined': (data: { player: ClientPlayer }) => void;
  'player-left': (data: { playerId: string; nickname: string }) => void;
  'game-started': (data: { gameState: ClientGameState }) => void;
  'winner-announcement': (data: { winners: WinnerInfo[] }) => void;
  'chat-message': (data: ChatMessage) => void;
  'player-kicked': (data: { playerId: string; nickname: string }) => void;
  'you-were-kicked': () => void;
  'host-changed': (data: { newHostId: string }) => void;
  'turn-timer': (data: { playerId: string; timeLeft: number }) => void;
  'toast': (data: { message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: { nickname: string; config?: Partial<RoomConfig> }) => void;
  'join-room': (data: { roomCode: string; nickname: string }) => void;
  'leave-room': () => void;
  'start-game': () => void;
  'player-action': (data: { type: PlayerActionType; amount?: number }) => void;
  'restart-game': () => void;
  'kick-player': (data: { playerId: string }) => void;
  'change-blinds': (data: { smallBlind: number; bigBlind: number }) => void;
  'send-chat': (data: { text: string }) => void;
}

// --- Default Config ---

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  smallBlind: 5,
  bigBlind: 10,
  startingChips: 1000,
  maxPlayers: 10,
  turnTimerSeconds: 30,
};

// --- Utility ---

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function stringToCard(str: string): Card {
  return {
    rank: str[0] as Rank,
    suit: str[1] as Suit,
  };
}
