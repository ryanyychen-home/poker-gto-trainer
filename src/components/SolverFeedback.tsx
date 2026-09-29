import { ArrowRight, CheckCircle2, Cpu, RotateCcw } from 'lucide-react'
import type { DecisionEvaluation, SolverResult } from '../solver/types'

interface SolverFeedbackProps {
  result: SolverResult
  evaluation: DecisionEvaluation
  onRetry: () => void
  onNext: () => void
}

const gradeClass = (grade: DecisionEvaluation['grade']) => grade.toLowerCase().replace(' ', '-')

export function SolverFeedback({ result, evaluation, onRetry, onNext }: SolverFeedbackProps) {
  return (
    <section className="action-panel solver-feedback">
      <div className="solver-summary">
        <div>
          <span className="eyebrow solver-engine"><Cpu size={12} /> {result.engine}</span>
          <div className="solver-verdict-row">
            <span className={`solver-grade ${gradeClass(evaluation.grade)}`}>{evaluation.grade}</span>
            <h2>{evaluation.evLoss === 0 ? 'No estimated EV loss' : `−${evaluation.evLoss.toFixed(2)} BB EV`}</h2>
          </div>
          <p>{evaluation.explanation}</p>
        </div>
        <div className="decision-actions">
          <button className="secondary-button" onClick={onRetry}>
            <RotateCcw size={17} /> Retry
          </button>
          <button className="next-button" onClick={onNext}>
            Next spot <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div className="solver-strategy-header">
        <div>
          <span className="eyebrow">Estimated GTO mix</span>
          <h3>Recommended strategy</h3>
        </div>
        <span className="solver-fidelity">PokerBench anchored</span>
      </div>

      <div className="solver-actions">
        {result.actions.map((action) => {
          const isChosen = evaluation.decision.action === action.action
          return (
            <div className={`solver-action-row ${action.isDominant ? 'dominant' : ''} ${isChosen ? 'chosen' : ''}`} key={`${action.action}-${action.amount ?? 'none'}`}>
              <div className="solver-action-copy">
                <strong>{action.label}</strong>
                <span>
                  {action.isDominant && <><CheckCircle2 size={12} /> Dominant</>}
                  {isChosen && !action.isDominant && 'Your choice'}
                  {!isChosen && !action.isDominant && `ΔEV −${action.evLoss.toFixed(2)} BB`}
                </span>
              </div>
              <div className="solver-frequency">
                <div><span style={{ width: `${action.probability * 100}%` }} /></div>
                <strong>{Math.round(action.probability * 100)}%</strong>
              </div>
            </div>
          )
        })}
      </div>

      <div className="solver-disclosure">
        <strong>Estimate, not an exact CFR solve.</strong> {result.assumptions[0]} {result.assumptions[2]}
      </div>
    </section>
  )
}
