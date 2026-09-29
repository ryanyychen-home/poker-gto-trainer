import { useState } from 'react'
import { ArrowUp, Check, X } from 'lucide-react'
import { pokerBenchSolver } from '../solver/pokerBenchSolver'
import type { Decision, PokerAction, TrainingScenario } from '../types'
import { SolverFeedback } from './SolverFeedback'

interface ActionPanelProps {
  scenario: TrainingScenario
  onDecision: (decision: Decision) => void
  onNext: () => void
}

const actionIcons = {
  fold: X,
  check: Check,
  call: Check,
  bet: ArrowUp,
  raise: ArrowUp,
}

export function ActionPanel({ scenario, onDecision, onNext }: ActionPanelProps) {
  const customAggressiveAction = scenario.availableActions.find(({ action, min, max }) =>
    (action === 'bet' || action === 'raise') && min !== undefined && max !== undefined)
  const aggressiveMin = customAggressiveAction?.min ?? 1
  const aggressiveMax = customAggressiveAction?.max ?? aggressiveMin
  const clampBetAmount = (amount: number) => Math.min(aggressiveMax, Math.max(aggressiveMin, amount))
  const [betAmount, setBetAmount] = useState(() => clampBetAmount(scenario.pot / 2))
  const [lastDecision, setLastDecision] = useState<Decision | null>(null)

  const potPresets = [
    { label: '⅓ pot', amount: scenario.pot / 3 },
    { label: '½ pot', amount: scenario.pot / 2 },
    { label: '⅔ pot', amount: scenario.pot * 2 / 3 },
    { label: 'Pot', amount: scenario.pot },
  ].filter(({ amount }) => amount > aggressiveMin && amount < aggressiveMax)
    .filter(({ amount }, index, values) => values.findIndex((preset) => Math.abs(preset.amount - amount) < 0.05) === index)
  const presets = aggressiveMin === aggressiveMax
    ? [{ label: 'All-in', amount: aggressiveMax }]
    : [
        { label: 'Min', amount: aggressiveMin },
        ...potPresets,
        { label: 'All-in', amount: aggressiveMax },
      ]

  const submit = (action: PokerAction, amount?: number) => {
    const isAggressive = action === 'bet' || action === 'raise'
    const decision = { action, amount: isAggressive && amount !== undefined ? clampBetAmount(amount) : amount }
    setLastDecision(decision)
    onDecision(decision)
  }

  if (lastDecision) {
    const solverResult = pokerBenchSolver.solve(scenario)
    const evaluation = pokerBenchSolver.evaluate(scenario, solverResult, lastDecision)
    return <SolverFeedback result={solverResult} evaluation={evaluation} onRetry={() => setLastDecision(null)} onNext={onNext} />
  }

  return (
    <section className="action-panel">
      <div className="action-heading">
        <div>
          <span className="turn-indicator"><i /> Your turn</span>
          <h2>{scenario.prompt}</h2>
        </div>
        <span className="decision-timer">No time limit</span>
      </div>

      {customAggressiveAction && (
        <div className="bet-builder">
          <div className="bet-presets">
            {presets.map((preset) => (
              <button key={preset.label} onClick={() => setBetAmount(preset.amount)}>{preset.label}</button>
            ))}
          </div>
          <div className="bet-control">
            <input
              aria-label={`${customAggressiveAction.label} amount`}
              type="range"
              min={customAggressiveAction.min}
              max={customAggressiveAction.max}
              step="0.5"
              value={betAmount}
              onChange={(event) => setBetAmount(Number(event.target.value))}
              style={{ '--range-progress': `${aggressiveMax === aggressiveMin ? 100 : ((betAmount - aggressiveMin) / (aggressiveMax - aggressiveMin)) * 100}%` } as React.CSSProperties}
            />
            <label>
              <input
                aria-label={`${customAggressiveAction.label} amount in big blinds`}
                type="number"
                min={customAggressiveAction.min}
                max={customAggressiveAction.max}
                step="0.5"
                value={Number(betAmount.toFixed(1))}
                onChange={(event) => setBetAmount(Number(event.target.value))}
              />
              <span>BB</span>
            </label>
          </div>
        </div>
      )}

      <div className="action-buttons">
        {scenario.availableActions.map(({ action, label, amount }) => {
          const Icon = actionIcons[action]
          const isAggressive = action === 'bet' || action === 'raise'
          return (
            <button
              className={`action-button action-${action}`}
              key={`${action}-${amount ?? 'custom'}`}
              onClick={() => submit(action, isAggressive ? (amount ?? betAmount) : amount)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {action === 'call' && amount && <small>{amount.toFixed(1)} BB</small>}
              {isAggressive && <small>{(amount ?? betAmount).toFixed(1)} BB</small>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
