import type { CardValue } from '../types'

const suitSymbols = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
} as const

interface PlayingCardProps {
  card?: CardValue
  hidden?: boolean
  compact?: boolean
}

export function PlayingCard({ card, hidden = false, compact = false }: PlayingCardProps) {
  if (hidden || !card) {
    return <div className={`playing-card card-back ${compact ? 'compact' : ''}`} aria-label="Hidden card" />
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'

  return (
    <div className={`playing-card ${isRed ? 'red' : 'black'} ${compact ? 'compact' : ''}`} aria-label={`${card.rank} of ${card.suit}`}>
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{suitSymbols[card.suit]}</span>
    </div>
  )
}
