import type { TrainingScenario } from './types'

export const demoScenario: TrainingScenario = {
  id: 'phase-1-demo-btn-vs-bb',
  source: 'demo',
  street: 'Flop',
  handNumber: 4,
  totalHands: 10,
  blinds: [0.5, 1],
  pot: 6.5,
  board: [
    { rank: 'A', suit: 'spades' },
    { rank: '7', suit: 'hearts' },
    { rank: '2', suit: 'diamonds' },
  ],
  seats: [
    { position: 'UTG', name: 'UTG', stack: 100, status: 'Folded' },
    { position: 'HJ', name: 'HJ', stack: 100, status: 'Folded' },
    { position: 'CO', name: 'CO', stack: 100, status: 'Folded' },
    {
      position: 'BTN',
      name: 'You',
      stack: 97.5,
      isHero: true,
      isDealer: true,
      isActive: true,
      cards: [
        { rank: 'A', suit: 'hearts' },
        { rank: 'J', suit: 'clubs' },
      ],
    },
    { position: 'SB', name: 'SB', stack: 99.5, status: 'Folded' },
    { position: 'BB', name: 'BB', stack: 97.5, status: 'Checked' },
  ],
  actionHistory: ['BTN raises to 2.5 BB', 'BB calls 1.5 BB', 'Flop dealt', 'BB checks'],
  availableActions: [
    { action: 'check', label: 'Check' },
    { action: 'bet', label: 'Bet', min: 1, max: 97.5 },
  ],
  prompt: 'Action is on you',
  contextLabel: 'BTN vs BB · Single-raised pot',
  effectiveStack: 97.5,
}
