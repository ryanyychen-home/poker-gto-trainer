import type { AvailableAction, Decision, PokerAction, TrainingScenario } from '../types'
import type { DecisionEvaluation, DecisionGrade, ScenarioSolver, SolverAction, SolverResult } from './types'

const round = (value: number, places = 2) => {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function actionAmount(option: AvailableAction, scenario: TrainingScenario) {
  if (option.action !== 'bet' && option.action !== 'raise') return option.amount

  const referenceAmount = scenario.referenceDecision?.action === option.action
    ? scenario.referenceDecision.amount
    : undefined

  if (referenceAmount !== undefined && option.min !== undefined && option.max !== undefined) {
    return clamp(referenceAmount, option.min, option.max)
  }

  if (option.amount !== undefined) return option.amount
  if (option.min !== undefined && option.max !== undefined) {
    return clamp(scenario.pot / 2, option.min, option.max)
  }
  return scenario.pot / 2
}

function actionLabel(action: PokerAction, amount?: number) {
  const name = action[0].toUpperCase() + action.slice(1)
  return amount === undefined ? name : `${name} ${amount.toFixed(1)} BB`
}

function alternativeLoss(
  option: AvailableAction,
  referenceAction: PokerAction,
  scenario: TrainingScenario,
) {
  const pot = Math.max(1, scenario.pot)
  const callAmount = scenario.availableActions.find(({ action }) => action === 'call')?.amount ?? 0

  if (option.action === referenceAction) return 0
  if (option.action === 'fold') return round(Math.max(0.25, pot * 0.085 + callAmount * 0.025))
  if (referenceAction === 'fold') return round(Math.max(0.2, callAmount * 0.12 + pot * 0.03))

  const optionAggressive = option.action === 'bet' || option.action === 'raise'
  const referenceAggressive = referenceAction === 'bet' || referenceAction === 'raise'

  if (optionAggressive !== referenceAggressive) return round(Math.max(0.2, pot * 0.055))
  return round(Math.max(0.12, pot * 0.03))
}

function distributeProbabilities(losses: number[], dominantIndex: number) {
  if (losses.length === 1) return [1]

  const dominantProbability = 0.68
  const remainingWeight = 1 - dominantProbability
  const temperature = Math.max(0.15, Math.max(...losses) * 0.6)
  const alternativeWeights = losses.map((loss, index) => index === dominantIndex ? 0 : Math.exp(-loss / temperature))
  const totalAlternativeWeight = alternativeWeights.reduce((sum, weight) => sum + weight, 0)

  return losses.map((_, index) => {
    if (index === dominantIndex) return dominantProbability
    if (!totalAlternativeWeight) return remainingWeight / (losses.length - 1)
    return remainingWeight * alternativeWeights[index] / totalAlternativeWeight
  })
}

function sizeLoss(scenario: TrainingScenario, decision: Decision) {
  const reference = scenario.referenceDecision
  if (!reference || decision.action !== reference.action || reference.amount === undefined) return 0

  const chosenAmount = decision.amount ?? 0
  const difference = Math.abs(chosenAmount - reference.amount)
  if (difference < 0.05) return 0

  return round(Math.max(0.05, difference * 0.055))
}

function gradeFor(loss: number, pot: number): DecisionGrade {
  if (loss < 0.025) return 'Optimal'
  if (loss <= Math.max(0.08, pot * 0.008)) return 'Excellent'
  if (loss <= Math.max(0.2, pot * 0.02)) return 'Good'
  if (loss <= Math.max(0.45, pot * 0.04)) return 'Inaccuracy'
  if (loss <= Math.max(1, pot * 0.08)) return 'Mistake'
  return 'Blunder'
}

function solve(scenario: TrainingScenario): SolverResult {
  const referenceAction = scenario.referenceDecision?.action
  const dominantIndex = Math.max(0, scenario.availableActions.findIndex(({ action }) => action === referenceAction))
  const losses = scenario.availableActions.map((option) => alternativeLoss(
    option,
    referenceAction ?? scenario.availableActions[dominantIndex]?.action ?? 'check',
    scenario,
  ))
  const probabilities = distributeProbabilities(losses, dominantIndex)
  const actions = scenario.availableActions.map((option, index): SolverAction => {
    const amount = actionAmount(option, scenario)
    const evLoss = losses[index]
    return {
      action: option.action,
      label: actionLabel(option.action, amount),
      amount,
      probability: probabilities[index],
      relativeEv: -evLoss,
      evLoss,
      isDominant: index === dominantIndex,
    }
  }).sort((a, b) => b.probability - a.probability)

  return {
    scenarioId: scenario.id,
    engine: 'PokerBench policy estimator v1',
    fidelity: 'estimated',
    actions,
    explanation: scenario.referenceDecision
      ? `${scenario.referenceDecision.label} is the published dominant action for this PokerBench spot.`
      : 'The highest-frequency action is inferred from the available decision set.',
    assumptions: [
      'PokerBench publishes the dominant action, not the original mixed strategy or action EVs.',
      'Secondary frequencies and EV losses are calibrated estimates relative to that dominant action.',
      'Exact CFR solving requires both players’ ranges and a configured betting tree.',
    ],
  }
}

function evaluate(
  scenario: TrainingScenario,
  result: SolverResult,
  decision: Decision,
): DecisionEvaluation {
  const bestAction = result.actions.find(({ isDominant }) => isDominant) ?? result.actions[0]
  const matchedAction = result.actions.find(({ action }) => action === decision.action)
  const actionLoss = matchedAction?.evLoss ?? Math.max(0.25, scenario.pot * 0.06)
  const sizingLoss = sizeLoss(scenario, decision)
  const evLoss = round(actionLoss + sizingLoss)
  const grade = gradeFor(evLoss, scenario.pot)
  const reference = scenario.referenceDecision

  let explanation = `${bestAction.label} is the dominant PokerBench action.`
  if (decision.action === reference?.action && sizingLoss > 0) {
    explanation = `The action matches, but the chosen size is ${Math.abs((decision.amount ?? 0) - (reference.amount ?? 0)).toFixed(1)} BB from the benchmark size.`
  } else if (decision.action === reference?.action) {
    explanation = 'Your action matches the published dominant action for this spot.'
  } else if (matchedAction) {
    explanation = `${matchedAction.label} is estimated to lose ${evLoss.toFixed(2)} BB against the dominant line.`
  }

  return {
    decision,
    grade,
    evLoss,
    matchedAction,
    bestAction,
    explanation,
  }
}

export const pokerBenchSolver: ScenarioSolver = { solve, evaluate }
