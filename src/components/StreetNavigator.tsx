import { Check } from 'lucide-react'
import type { Street } from '../types'

const streets: Street[] = ['Preflop', 'Flop', 'Turn', 'River']

interface StreetNavigatorProps {
  currentStreet: Street
  selectedStreet: Street
  onSelect: (street: Street) => void
}

export function StreetNavigator({ currentStreet, selectedStreet, onSelect }: StreetNavigatorProps) {
  const currentIndex = streets.indexOf(currentStreet)

  return (
    <nav className="street-navigator" aria-label="Hand streets">
      {streets.map((street, index) => {
        const isAvailable = index <= currentIndex
        const isComplete = index < currentIndex
        const isSelected = street === selectedStreet
        const isCurrent = street === currentStreet

        return (
          <div className="street-step" key={street}>
            {index > 0 && <span className={`street-connector ${isAvailable ? 'available' : ''}`} />}
            <button
              className={`${isAvailable ? 'available' : 'locked'} ${isSelected ? 'selected' : ''}`}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(street)}
              aria-current={isSelected ? 'step' : undefined}
            >
              <span className="street-node">{isComplete ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
              <span className="street-name">{street === 'Preflop' ? 'Pre-Flop' : street}</span>
              {isCurrent && <small>Current</small>}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
