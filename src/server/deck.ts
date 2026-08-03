// ============================================================
// Vasu-Juari Poker — Deck Module
// ============================================================

import { Card, Suit, Rank } from '@/lib/types';

const SUITS: Suit[] = ['h', 'd', 'c', 's'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

/**
 * Create a standard 52-card deck.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle — cryptographically fair for casual play.
 */
export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal `count` cards from the top of the deck.
 * Returns [dealt cards, remaining deck].
 */
export function deal(deck: Card[], count: number): [Card[], Card[]] {
  if (count > deck.length) {
    throw new Error(`Cannot deal ${count} cards from a deck of ${deck.length}`);
  }
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [dealt, remaining];
}

/**
 * Create a shuffled deck ready for play.
 */
export function createShuffledDeck(): Card[] {
  return shuffle(createDeck());
}
