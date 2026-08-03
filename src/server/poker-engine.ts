// ============================================================
// Vasu-Juari Poker — Game Engine (Server-Authoritative)
// ============================================================
// Core state machine for Texas Hold'em No Limit.
// All game logic runs server-side. Clients only send actions.

import {
  GameState,
  GamePhase,
  Player,
  PlayerActionType,
  PlayerAction,
  Pot,
  RoomConfig,
  ClientGameState,
  ClientPlayer,
  WinnerInfo,
  Card,
} from '@/lib/types';
import { createShuffledDeck, deal } from './deck';
import { findPotWinners } from './hand-evaluator';

// ---- Game Initialization ----

export function createInitialGameState(): GameState {
  return {
    deck: [],
    communityCards: [],
    players: [],
    pots: [{ amount: 0, eligiblePlayerIds: [] }],
    phase: 'waiting',
    dealerIndex: -1,
    currentPlayerIndex: -1,
    smallBlindIndex: -1,
    bigBlindIndex: -1,
    currentBet: 0,
    minRaise: 0,
    lastRaiseAmount: 0,
    handNumber: 0,
    winners: [],
  };
}

// ---- Player Management ----

export function addPlayer(
  state: GameState,
  id: string,
  nickname: string,
  startingChips: number,
  isHost: boolean
): GameState {
  const seatIndex = findNextAvailableSeat(state);
  if (seatIndex === -1) return state;

  const player: Player = {
    id,
    nickname,
    chips: startingChips,
    bet: 0,
    totalBet: 0,
    holeCards: [],
    status: 'waiting',
    seatIndex,
    isHost,
    isConnected: true,
    hasActed: false,
  };

  return {
    ...state,
    players: [...state.players, player],
  };
}

export function removePlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  };
}

function findNextAvailableSeat(state: GameState): number {
  const taken = new Set(state.players.map((p) => p.seatIndex));
  for (let i = 0; i < 10; i++) {
    if (!taken.has(i)) return i;
  }
  return -1;
}

// ---- Hand Start ----

export function startHand(state: GameState, config: RoomConfig): GameState {
  const activePlayers = state.players.filter(
    (p) => p.chips > 0 && p.isConnected
  );
  if (activePlayers.length < 2) return state;

  // Create new shuffled deck
  const deck = createShuffledDeck();

  // Rotate dealer
  const dealerIndex = findNextDealer(state);
  const { smallBlindIndex, bigBlindIndex } = findBlinds(
    state.players,
    dealerIndex
  );

  // Reset players for new hand
  let players: Player[] = state.players.map((p) => ({
    ...p,
    bet: 0,
    totalBet: 0,
    holeCards: [] as Card[],
    status: (p.chips > 0 && p.isConnected ? 'active' : 'eliminated') as Player['status'],
    hasActed: false,
    lastAction: undefined,
  }));

  // Deal hole cards to active players
  let currentDeck = deck;
  players = players.map((p) => {
    if (p.status !== 'active') return p;
    const [cards, remaining] = deal(currentDeck, 2);
    currentDeck = remaining;
    return { ...p, holeCards: cards };
  });

  // Post blinds
  players = postBlinds(players, smallBlindIndex, bigBlindIndex, config);

  // First to act is after big blind
  const currentPlayerIndex = findNextActivePlayer(
    players,
    bigBlindIndex
  );

  return {
    ...state,
    deck: currentDeck,
    communityCards: [],
    players,
    pots: [
      {
        amount: config.smallBlind + config.bigBlind,
        eligiblePlayerIds: players
          .filter((p) => p.status === 'active' || p.status === 'allIn')
          .map((p) => p.id),
      },
    ],
    phase: 'preflop',
    dealerIndex,
    currentPlayerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentBet: config.bigBlind,
    minRaise: config.bigBlind,
    lastRaiseAmount: config.bigBlind,
    handNumber: state.handNumber + 1,
    winners: [],
  };
}

function findNextDealer(state: GameState): number {
  const activePlayers = state.players.filter(
    (p) => p.chips > 0 && p.isConnected
  );
  if (activePlayers.length === 0) return 0;

  if (state.dealerIndex === -1) {
    // First hand — random dealer
    return activePlayers[0].seatIndex;
  }

  // Find next active player after current dealer
  return findNextActivePlayerIndex(state.players, state.dealerIndex);
}

function findBlinds(
  players: Player[],
  dealerIndex: number
): { smallBlindIndex: number; bigBlindIndex: number } {
  const activePlayers = players.filter(
    (p) => (p.chips > 0 && p.isConnected) || p.status === 'active'
  );

  if (activePlayers.length === 2) {
    // Heads-up: dealer is small blind
    const smallBlindIndex = dealerIndex;
    const bigBlindIndex = findNextActivePlayerIndex(players, dealerIndex);
    return { smallBlindIndex, bigBlindIndex };
  }

  const smallBlindIndex = findNextActivePlayerIndex(players, dealerIndex);
  const bigBlindIndex = findNextActivePlayerIndex(players, smallBlindIndex);
  return { smallBlindIndex, bigBlindIndex };
}

function postBlinds(
  players: Player[],
  smallBlindIndex: number,
  bigBlindIndex: number,
  config: RoomConfig
): Player[] {
  return players.map((p) => {
    if (p.seatIndex === smallBlindIndex) {
      const amount = Math.min(config.smallBlind, p.chips);
      return {
        ...p,
        bet: amount,
        totalBet: amount,
        chips: p.chips - amount,
        status: (p.chips - amount === 0 ? 'allIn' : p.status) as Player['status'],
      };
    }
    if (p.seatIndex === bigBlindIndex) {
      const amount = Math.min(config.bigBlind, p.chips);
      return {
        ...p,
        bet: amount,
        totalBet: amount,
        chips: p.chips - amount,
        status: (p.chips - amount === 0 ? 'allIn' : p.status) as Player['status'],
      };
    }
    return p;
  });
}

// ---- Player Actions ----

export function handlePlayerAction(
  state: GameState,
  playerId: string,
  actionType: PlayerActionType,
  amount?: number,
  config?: RoomConfig
): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return state;

  const player = state.players[playerIndex];

  // Validate it's this player's turn
  if (state.players[state.currentPlayerIndex]?.id !== playerId) return state;

  // Validate player is active
  if (player.status !== 'active') return state;

  let newState = { ...state };
  const action: PlayerAction = {
    type: actionType,
    amount: amount || 0,
    timestamp: Date.now(),
  };

  switch (actionType) {
    case 'fold':
      newState = handleFold(newState, playerIndex, action);
      break;
    case 'check':
      newState = handleCheck(newState, playerIndex, action);
      break;
    case 'call':
      newState = handleCall(newState, playerIndex, action);
      break;
    case 'bet':
      newState = handleBet(newState, playerIndex, amount || 0, action);
      break;
    case 'raise':
      newState = handleRaise(newState, playerIndex, amount || 0, action);
      break;
    case 'allIn':
      newState = handleAllIn(newState, playerIndex, action);
      break;
    default:
      return state;
  }

  // Check if only one player remains
  const remainingActive = newState.players.filter(
    (p) => p.status === 'active' || p.status === 'allIn'
  );

  if (remainingActive.length === 1) {
    // Everyone else folded
    return resolveWinner(newState);
  }

  // Check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    return advancePhase(newState, config);
  }

  // Move to next player
  newState.currentPlayerIndex = findNextActivePlayer(
    newState.players,
    newState.currentPlayerIndex
  );

  return newState;
}

function handleFold(
  state: GameState,
  playerIndex: number,
  action: PlayerAction
): GameState {
  const players = [...state.players];
  players[playerIndex] = {
    ...players[playerIndex],
    status: 'folded',
    hasActed: true,
    lastAction: action,
  };
  return {
    ...state,
    players,
    lastAction: { playerId: players[playerIndex].id, action },
  };
}

function handleCheck(
  state: GameState,
  playerIndex: number,
  action: PlayerAction
): GameState {
  const player = state.players[playerIndex];
  // Can only check if current bet equals player's bet
  if (state.currentBet > player.bet) return state;

  const players = [...state.players];
  players[playerIndex] = {
    ...players[playerIndex],
    hasActed: true,
    lastAction: { ...action, amount: 0 },
  };
  return {
    ...state,
    players,
    lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: 0 } },
  };
}

function handleCall(
  state: GameState,
  playerIndex: number,
  action: PlayerAction
): GameState {
  const player = state.players[playerIndex];
  const callAmount = Math.min(state.currentBet - player.bet, player.chips);

  const players = [...state.players];
  const newChips = player.chips - callAmount;
  players[playerIndex] = {
    ...players[playerIndex],
    bet: player.bet + callAmount,
    totalBet: player.totalBet + callAmount,
    chips: newChips,
    status: newChips === 0 ? 'allIn' : 'active',
    hasActed: true,
    lastAction: { ...action, amount: callAmount },
  };

  // Update pot
  const pots = [...state.pots];
  pots[pots.length - 1] = {
    ...pots[pots.length - 1],
    amount: pots[pots.length - 1].amount + callAmount,
  };

  return {
    ...state,
    players,
    pots,
    lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: callAmount } },
  };
}

function handleBet(
  state: GameState,
  playerIndex: number,
  amount: number,
  action: PlayerAction
): GameState {
  const player = state.players[playerIndex];
  // Can only bet if no one has bet yet (currentBet === 0 or player.bet === currentBet)
  if (state.currentBet > 0 && player.bet < state.currentBet) return state;

  const betAmount = Math.min(amount, player.chips);
  if (betAmount <= 0) return state;

  const players = [...state.players];
  const newChips = player.chips - betAmount;
  players[playerIndex] = {
    ...players[playerIndex],
    bet: player.bet + betAmount,
    totalBet: player.totalBet + betAmount,
    chips: newChips,
    status: newChips === 0 ? 'allIn' : 'active',
    hasActed: true,
    lastAction: { ...action, amount: betAmount },
  };

  // Reset hasActed for other active players (new bet requires action)
  for (let i = 0; i < players.length; i++) {
    if (i !== playerIndex && players[i].status === 'active') {
      players[i] = { ...players[i], hasActed: false };
    }
  }

  const pots = [...state.pots];
  pots[pots.length - 1] = {
    ...pots[pots.length - 1],
    amount: pots[pots.length - 1].amount + betAmount,
  };

  return {
    ...state,
    players,
    pots,
    currentBet: player.bet + betAmount,
    minRaise: betAmount,
    lastRaiseAmount: betAmount,
    lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: betAmount } },
  };
}

function handleRaise(
  state: GameState,
  playerIndex: number,
  totalAmount: number,
  action: PlayerAction
): GameState {
  const player = state.players[playerIndex];
  const raiseToAmount = totalAmount; // total bet amount the player wants to be at
  const additionalChips = raiseToAmount - player.bet;

  if (additionalChips <= 0 || additionalChips > player.chips) return state;

  const raiseAmount = raiseToAmount - state.currentBet;
  if (raiseAmount < state.minRaise && additionalChips < player.chips) {
    // Must raise at least the minimum, unless going all-in
    return state;
  }

  const players = [...state.players];
  const newChips = player.chips - additionalChips;
  players[playerIndex] = {
    ...players[playerIndex],
    bet: raiseToAmount,
    totalBet: player.totalBet + additionalChips,
    chips: newChips,
    status: newChips === 0 ? 'allIn' : 'active',
    hasActed: true,
    lastAction: { ...action, amount: additionalChips },
  };

  // Reset hasActed for other active players
  for (let i = 0; i < players.length; i++) {
    if (i !== playerIndex && players[i].status === 'active') {
      players[i] = { ...players[i], hasActed: false };
    }
  }

  const pots = [...state.pots];
  pots[pots.length - 1] = {
    ...pots[pots.length - 1],
    amount: pots[pots.length - 1].amount + additionalChips,
  };

  return {
    ...state,
    players,
    pots,
    currentBet: raiseToAmount,
    minRaise: Math.max(raiseAmount, state.minRaise),
    lastRaiseAmount: raiseAmount,
    lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: additionalChips } },
  };
}

function handleAllIn(
  state: GameState,
  playerIndex: number,
  action: PlayerAction
): GameState {
  const player = state.players[playerIndex];
  const allInAmount = player.chips;
  const newTotalBet = player.bet + allInAmount;

  const players = [...state.players];
  players[playerIndex] = {
    ...players[playerIndex],
    bet: newTotalBet,
    totalBet: player.totalBet + allInAmount,
    chips: 0,
    status: 'allIn',
    hasActed: true,
    lastAction: { ...action, amount: allInAmount },
  };

  // If this is a raise, reset hasActed for others
  if (newTotalBet > state.currentBet) {
    const raiseAmount = newTotalBet - state.currentBet;
    for (let i = 0; i < players.length; i++) {
      if (i !== playerIndex && players[i].status === 'active') {
        players[i] = { ...players[i], hasActed: false };
      }
    }

    const pots = [...state.pots];
    pots[pots.length - 1] = {
      ...pots[pots.length - 1],
      amount: pots[pots.length - 1].amount + allInAmount,
    };

    return {
      ...state,
      players,
      pots,
      currentBet: newTotalBet,
      minRaise: Math.max(raiseAmount, state.minRaise),
      lastRaiseAmount: raiseAmount,
      lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: allInAmount } },
    };
  }

  const pots = [...state.pots];
  pots[pots.length - 1] = {
    ...pots[pots.length - 1],
    amount: pots[pots.length - 1].amount + allInAmount,
  };

  return {
    ...state,
    players,
    pots,
    lastAction: { playerId: players[playerIndex].id, action: { ...action, amount: allInAmount } },
  };
}

// ---- Betting Round Logic ----

function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter((p) => p.status === 'active');

  // If no active players (all folded or all-in), round is complete
  if (activePlayers.length === 0) return true;

  // If only one active player and they've matched the bet, round is complete
  if (activePlayers.length === 1) {
    const player = activePlayers[0];
    if (player.bet >= state.currentBet && player.hasActed) return true;
    // If no one else can act (all others folded/all-in), check if this player has acted
    const othersCanAct = state.players.filter(
      (p) => p.status === 'active' && p.id !== player.id
    );
    if (othersCanAct.length === 0 && player.hasActed) return true;
  }

  // All active players must have acted and matched the current bet
  return activePlayers.every(
    (p) => p.hasActed && p.bet >= state.currentBet
  );
}

// ---- Phase Advancement ----

function advancePhase(state: GameState, config?: RoomConfig): GameState {
  // Calculate side pots before advancing
  let newState = calculateSidePots(state);

  // Reset bets for new round
  newState = {
    ...newState,
    players: newState.players.map((p) => ({
      ...p,
      bet: 0,
      hasActed: false,
    })),
    currentBet: 0,
    minRaise: config?.bigBlind || 10,
    lastRaiseAmount: 0,
  };

  const nextPhase = getNextPhase(newState.phase);

  if (nextPhase === 'showdown') {
    return resolveShowdown(newState);
  }

  // Deal community cards
  let deck = [...newState.deck];
  let communityCards = [...newState.communityCards];

  switch (nextPhase) {
    case 'flop': {
      // Burn one, deal three
      const [, afterBurn] = deal(deck, 1);
      const [flopCards, remaining] = deal(afterBurn, 3);
      deck = remaining;
      communityCards = [...communityCards, ...flopCards];
      break;
    }
    case 'turn': {
      const [, afterBurn] = deal(deck, 1);
      const [turnCard, remaining] = deal(afterBurn, 1);
      deck = remaining;
      communityCards = [...communityCards, ...turnCard];
      break;
    }
    case 'river': {
      const [, afterBurn] = deal(deck, 1);
      const [riverCard, remaining] = deal(afterBurn, 1);
      deck = remaining;
      communityCards = [...communityCards, ...riverCard];
      break;
    }
  }

  // Find first active player after dealer
  const currentPlayerIndex = findNextActivePlayer(
    newState.players,
    newState.dealerIndex
  );

  // If only one player can act, or none, go straight to showdown
  const activePlayers = newState.players.filter((p) => p.status === 'active');
  if (activePlayers.length <= 1) {
    // Check if we need to deal remaining community cards
    const finalState: GameState = {
      ...newState,
      deck,
      communityCards,
      phase: nextPhase,
      currentPlayerIndex: -1,
    };

    if (communityCards.length < 5) {
      // Need to deal remaining cards, then showdown
      return runOutCommunityCards(finalState);
    }

    return resolveShowdown(finalState);
  }

  return {
    ...newState,
    deck,
    communityCards,
    phase: nextPhase,
    currentPlayerIndex,
  };
}

/**
 * When all players are all-in, deal remaining community cards
 * without any betting rounds.
 */
function runOutCommunityCards(state: GameState): GameState {
  let deck = [...state.deck];
  let communityCards = [...state.communityCards];

  while (communityCards.length < 5) {
    const [, afterBurn] = deal(deck, 1);
    const count = communityCards.length === 0 ? 3 : 1;
    const [cards, remaining] = deal(afterBurn, count);
    deck = remaining;
    communityCards = [...communityCards, ...cards];
  }

  return resolveShowdown({
    ...state,
    deck,
    communityCards,
  });
}

function getNextPhase(currentPhase: GamePhase): GamePhase {
  const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const idx = phases.indexOf(currentPhase);
  return phases[idx + 1] || 'showdown';
}

// ---- Showdown & Winner Resolution ----

function resolveShowdown(state: GameState): GameState {
  const pots = calculateSidePots(state).pots;
  const winners: WinnerInfo[] = [];

  let players = [...state.players];

  for (const pot of pots) {
    const potWinners = findPotWinners(
      pot.eligiblePlayerIds,
      state.players,
      state.communityCards
    );

    if (potWinners.length > 0) {
      const share = Math.floor(pot.amount / potWinners.length);
      const remainder = pot.amount - share * potWinners.length;

      potWinners.forEach((w, idx) => {
        const winAmount = share + (idx === 0 ? remainder : 0);
        w.potAmount = winAmount;
        winners.push(w);

        // Add winnings to player
        players = players.map((p) =>
          p.id === w.playerId ? { ...p, chips: p.chips + winAmount } : p
        );
      });
    }
  }

  // Merge multiple pot wins for same player
  const mergedWinners = mergeWinners(winners);

  return {
    ...state,
    players,
    pots,
    phase: 'showdown',
    currentPlayerIndex: -1,
    winners: mergedWinners,
  };
}

function resolveWinner(state: GameState): GameState {
  const activePlayers = state.players.filter(
    (p) => p.status === 'active' || p.status === 'allIn'
  );

  if (activePlayers.length !== 1) {
    return resolveShowdown(state);
  }

  const winner = activePlayers[0];
  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0);

  const players = state.players.map((p) =>
    p.id === winner.id ? { ...p, chips: p.chips + totalPot } : p
  );

  return {
    ...state,
    players,
    phase: 'showdown',
    currentPlayerIndex: -1,
    winners: [
      {
        playerId: winner.id,
        potAmount: totalPot,
        handName: 'Last Standing',
        handDescription: 'Everyone else folded',
        cards: winner.holeCards,
      },
    ],
  };
}

function mergeWinners(winners: WinnerInfo[]): WinnerInfo[] {
  const map = new Map<string, WinnerInfo>();
  for (const w of winners) {
    const existing = map.get(w.playerId);
    if (existing) {
      existing.potAmount += w.potAmount;
    } else {
      map.set(w.playerId, { ...w });
    }
  }
  return Array.from(map.values());
}

// ---- Side Pot Calculation ----

function calculateSidePots(state: GameState): GameState {
  const activePlayers = state.players.filter(
    (p) => p.status === 'active' || p.status === 'allIn' || p.status === 'folded'
  );

  if (activePlayers.length === 0) return state;

  // Get all-in amounts sorted
  const allInAmounts = state.players
    .filter((p) => p.status === 'allIn')
    .map((p) => p.totalBet)
    .sort((a, b) => a - b);

  // Remove duplicates
  const uniqueAmounts = [...new Set(allInAmounts)];

  if (uniqueAmounts.length === 0) {
    // No all-ins — single main pot
    const totalPot = state.players.reduce((sum, p) => sum + p.totalBet, 0);
    return {
      ...state,
      pots: [
        {
          amount: totalPot,
          eligiblePlayerIds: state.players
            .filter((p) => p.status === 'active' || p.status === 'allIn')
            .map((p) => p.id),
        },
      ],
    };
  }

  // Build side pots
  const pots: Pot[] = [];
  let previousLevel = 0;

  for (const level of uniqueAmounts) {
    const contribution = level - previousLevel;
    const contributors = state.players.filter(
      (p) => p.totalBet >= level
    );
    const eligible = contributors.filter(
      (p) => p.status === 'active' || p.status === 'allIn'
    );

    pots.push({
      amount: contribution * contributors.length,
      eligiblePlayerIds: eligible.map((p) => p.id),
    });

    previousLevel = level;
  }

  // Remaining main pot for players who bet more than the highest all-in
  const maxAllIn = uniqueAmounts[uniqueAmounts.length - 1];
  const remainingContributors = state.players.filter(
    (p) => p.totalBet > maxAllIn
  );

  if (remainingContributors.length > 0) {
    const remainingAmount = remainingContributors.reduce(
      (sum, p) => sum + (p.totalBet - maxAllIn),
      0
    );
    const eligible = remainingContributors.filter(
      (p) => p.status === 'active' || p.status === 'allIn'
    );
    if (remainingAmount > 0) {
      pots.push({
        amount: remainingAmount,
        eligiblePlayerIds: eligible.map((p) => p.id),
      });
    }
  }

  return { ...state, pots };
}

// ---- Helper Functions ----

function findNextActivePlayer(
  players: Player[],
  fromIndex: number
): number {
  const n = players.length;
  // Sort by seat index to iterate in seat order
  const sortedPlayers = [...players].sort((a, b) => a.seatIndex - b.seatIndex);

  // Find the starting position in sorted order
  let startPos = 0;
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (sortedPlayers[i].seatIndex > fromIndex) {
      startPos = i;
      break;
    }
    if (i === sortedPlayers.length - 1) {
      startPos = 0;
    }
  }

  // Search for next active player
  for (let i = 0; i < n; i++) {
    const idx = (startPos + i) % n;
    const player = sortedPlayers[idx];
    if (player.status === 'active') {
      // Return the index in the original players array
      return players.findIndex((p) => p.id === player.id);
    }
  }

  return -1;
}

function findNextActivePlayerIndex(
  players: Player[],
  fromSeatIndex: number
): number {
  const sortedPlayers = players
    .filter((p) => (p.chips > 0 && p.isConnected) || p.status === 'active')
    .sort((a, b) => a.seatIndex - b.seatIndex);

  if (sortedPlayers.length === 0) return 0;

  for (const p of sortedPlayers) {
    if (p.seatIndex > fromSeatIndex) return p.seatIndex;
  }
  return sortedPlayers[0].seatIndex;
}

// ---- Client State Sanitization ----

export function getClientGameState(
  state: GameState,
  playerId: string
): ClientGameState {
  const clientPlayers: ClientPlayer[] = state.players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    chips: p.chips,
    bet: p.bet,
    totalBet: p.totalBet,
    holeCards: getVisibleCards(p, playerId, state.phase),
    status: p.status,
    seatIndex: p.seatIndex,
    isHost: p.isHost,
    isConnected: p.isConnected,
    hasActed: p.hasActed,
    lastAction: p.lastAction,
  }));

  return {
    communityCards: state.communityCards,
    players: clientPlayers,
    pots: state.pots,
    phase: state.phase,
    dealerIndex: state.dealerIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    smallBlindIndex: state.smallBlindIndex,
    bigBlindIndex: state.bigBlindIndex,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    handNumber: state.handNumber,
    winners: state.winners,
    myPlayerId: playerId,
    lastAction: state.lastAction,
  };
}

function getVisibleCards(
  player: Player,
  viewerId: string,
  phase: GamePhase
): Card[] | null {
  // Players can always see their own cards
  if (player.id === viewerId) return player.holeCards;

  // During showdown, show active/all-in players' cards
  if (phase === 'showdown' && (player.status === 'active' || player.status === 'allIn')) {
    return player.holeCards;
  }

  // Otherwise, hide other players' cards
  return null;
}

// ---- Action Validation ----

export function getValidActions(
  state: GameState,
  playerId: string
): PlayerActionType[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.status !== 'active') return [];
  if (state.players[state.currentPlayerIndex]?.id !== playerId) return [];

  const actions: PlayerActionType[] = ['fold'];

  if (player.bet >= state.currentBet) {
    actions.push('check');
  }

  if (state.currentBet > player.bet) {
    actions.push('call');
  }

  if (state.currentBet === 0 || player.bet === state.currentBet) {
    if (player.chips > 0) {
      actions.push('bet');
    }
  }

  if (state.currentBet > 0 && player.chips + player.bet > state.currentBet) {
    actions.push('raise');
  }

  if (player.chips > 0) {
    actions.push('allIn');
  }

  return actions;
}
