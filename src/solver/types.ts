import type { Decision, PokerAction, TrainingScenario } from '../types'

export interface SolverAction {
  action: PokerAction
  label: string
  amount?: number
  probability: number
  relativeEv: number
  evLoss: number
  isDominant: boolean
}

export interface SolverResult {
  scenarioId: string
  engine: string
  fidelity: 'estimated' | 'exact'
  actions: SolverAction[]
  explanation: string
  assumptions: string[]
}

export type DecisionGrade = 'Optimal' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder'

export interface DecisionEvaluation {
  decision: Decision
  grade: DecisionGrade
  evLoss: number
  matchedAction?: SolverAction
  bestAction: SolverAction
  explanation: string
}

export interface ScenarioSolver {
  solve: (scenario: TrainingScenario) => SolverResult
  evaluate: (scenario: TrainingScenario, result: SolverResult, decision: Decision) => DecisionEvaluation
}
