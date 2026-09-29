import { PlayingCard } from './PlayingCard'
import { PlayerSeat } from './PlayerSeat'
import type { TrainingScenario } from '../types'

interface PokerTableProps {
  scenario: TrainingScenario
}

export function PokerTable({ scenario }: PokerTableProps) {
  const heroIndex = scenario.seats.findIndex((seat) => seat.isHero)

  const visualSeatIndex = (seatIndex: number) => {
    if (heroIndex === -1) return seatIndex

    const clockwiseOffsetFromHero = (seatIndex - heroIndex + scenario.seats.length) % scenario.seats.length
    return (4 + clockwiseOffsetFromHero) % scenario.seats.length
  }

  return (
    <section className="table-stage" aria-label="Six-handed poker table">
      <div className="table-rail">
        <div className="table-felt">
          <div className="felt-grain" />
          <div className="table-center">
            <div className="pot-label">POT <strong>{scenario.pot.toFixed(1)} BB</strong></div>
            <div className="community-cards">
              {scenario.board.map((card) => <PlayingCard card={card} key={`${card.rank}-${card.suit}`} />)}
              {Array.from({ length: 5 - scenario.board.length }).map((_, index) => (
                <div className="card-placeholder" key={index} />
              ))}
            </div>
            <div className="street-label">{scenario.street}</div>
          </div>
        </div>
      </div>
      {scenario.seats.map((seat, index) => (
        <PlayerSeat seat={seat} seatIndex={visualSeatIndex(index)} key={seat.position} />
      ))}
    </section>
  )
}
