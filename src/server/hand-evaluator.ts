// ============================================================
// Vasu-Juari Poker — Hand Evaluator
// ============================================================
// Wrapper around pokersolver for hand evaluation.

import { Card, WinnerInfo, Player, cardToString } from '@/lib/types';

// pokersolver is a JS library, so we need to require it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Hand = require('pokersolver').Hand;

/**
 * Convert our Card format to pokersolver format.
 * pokersolver uses: rank + suit_char (e.g., "Ad" for Ace of diamonds)
 * Our format: { rank: 'A', suit: 'd' }
 * pokersolver suit mapping: h, d, c, s (same as ours)
 * pokersolver rank mapping: 2-9, T, J, Q, K, A (same as ours)
 */
function toPokersolverCard(card: Card): string {
  return cardToString(card);
}

/**
 * Evaluate a hand given hole cards and community cards.
 * Returns the best 5-card hand from 7 cards.
 */
export function evaluateHand(holeCards: Card[], communityCards: Card[]) {
  const allCards = [...holeCards, ...communityCards].map(toPokersolverCard);
  const solved = Hand.solve(allCards);
  return {
    rank: solved.rank as number,
    name: solved.name as string,
    description: solved.descr as string,
    cards: solved.cards,
  };
}

/**
 * Find the winner(s) from a list of active players.
 * Returns winner info including hand description.
 */
export function findWinners(
  players: Player[],
  communityCards: Card[]
): WinnerInfo[] {
  const activePlayers = players.filter(
    (p) => p.status === 'active' || p.status === 'allIn'
  );

  if (activePlayers.length === 0) return [];

  if (activePlayers.length === 1) {
    // Everyone else folded — last player wins (no hand eval needed)
    const winner = activePlayers[0];
    return [
      {
        playerId: winner.id,
        potAmount: 0, // will be filled in by engine
        handName: 'Last Standing',
        handDescription: 'Everyone else folded',
        cards: winner.holeCards,
      },
    ];
  }

  // Evaluate all active players' hands
  const hands = activePlayers.map((player) => {
    const allCards = [...player.holeCards, ...communityCards].map(toPokersolverCard);
    const solved = Hand.solve(allCards);
    return {
      player,
      solved,
      description: solved.descr as string,
      name: solved.name as string,
    };
  });

  // Use pokersolver's winner comparison
  const solvedHands = hands.map((h) => h.solved);
  const winnerHands = Hand.winners(solvedHands);

  // Map winning hands back to players
  const winners: WinnerInfo[] = [];
  for (const winnerHand of winnerHands) {
    const match = hands.find((h) => h.solved === winnerHand);
    if (match) {
      winners.push({
        playerId: match.player.id,
        potAmount: 0, // will be filled in by the engine
        handName: match.name,
        handDescription: match.description,
        cards: match.player.holeCards,
      });
    }
  }

  return winners;
}

/**
 * Evaluate winners for a specific pot (side pot support).
 * Only players eligible for this pot are considered.
 */
export function findPotWinners(
  eligiblePlayerIds: string[],
  players: Player[],
  communityCards: Card[]
): WinnerInfo[] {
  const eligiblePlayers = players.filter(
    (p) =>
      eligiblePlayerIds.includes(p.id) &&
      (p.status === 'active' || p.status === 'allIn')
  );

  return findWinners(eligiblePlayers, communityCards);
}
