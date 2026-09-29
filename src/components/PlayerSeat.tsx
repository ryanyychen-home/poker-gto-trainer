import { PlayingCard } from './PlayingCard'
import type { PlayerSeat as PlayerSeatData } from '../types'

interface PlayerSeatProps {
  seat: PlayerSeatData
  seatIndex: number
}

export function PlayerSeat({ seat, seatIndex }: PlayerSeatProps) {
  const classes = [
    'player-seat',
    `seat-${seatIndex}`,
    seat.isHero ? 'hero' : '',
    seat.isActive ? 'active' : '',
    seat.status === 'Folded' ? 'folded' : '',
    seat.status && seat.status !== 'Folded' ? 'has-action' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {seat.isDealer && <span className="dealer-button">D</span>}
      <div className="seat-cards">
        {seat.cards?.map((card) => <PlayingCard card={card} compact key={`${card.rank}-${card.suit}`} />)}
        {!seat.cards && seat.status !== 'Folded' && (
          <>
            <PlayingCard hidden compact />
            <PlayingCard hidden compact />
          </>
        )}
      </div>
      <div className="seat-panel">
        <div className="seat-name-row">
          <span className="seat-name">{seat.name}</span>
          <span className="seat-position">{seat.position}</span>
        </div>
        <div className="seat-stack">{seat.stack.toFixed(1)} <small>BB</small></div>
        {seat.status && (
          <span className="seat-status">
            {seat.status !== 'Folded' && <i aria-hidden="true" />}
            {seat.status}
          </span>
        )}
      </div>
    </div>
  )
}
