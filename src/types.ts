export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'

export interface CardValue {
  rank: Rank
  suit: Suit
}

export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB'

export interface PlayerSeat {
  position: Position
  name: string
  stack: number
  status?: string
  isHero?: boolean
  isActive?: boolean
  isDealer?: boolean
  cards?: CardValue[]
}

export type PokerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise'

export interface AvailableAction {
  action: PokerAction
  label: string
  amount?: number
  min?: number
  max?: number
}

export interface ReferenceDecision {
  action: PokerAction
  amount?: number
  label: string
}

export type Street = 'Preflop' | 'Flop' | 'Turn' | 'River'

export interface StreetSnapshot {
  street: Street
  pot: number
  board: CardValue[]
  seats: PlayerSeat[]
  actionHistory: string[]
}

export interface TrainingScenario {
  id: string
  source: 'demo' | 'pokerbench' | 'solver'
  street: Street
  handNumber: number
  totalHands?: number
  blinds: [number, number]
  pot: number
  board: CardValue[]
  seats: PlayerSeat[]
  actionHistory: string[]
  availableActions: AvailableAction[]
  prompt: string
  contextLabel: string
  effectiveStack: number
  referenceDecision?: ReferenceDecision
  streetSnapshots?: Partial<Record<Street, StreetSnapshot>>
}

export interface Decision {
  action: PokerAction
  amount?: number
}
