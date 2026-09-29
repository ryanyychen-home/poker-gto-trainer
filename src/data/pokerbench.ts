import type {
  AvailableAction,
  CardValue,
  PlayerSeat,
  PokerAction,
  Position,
  Rank,
  ReferenceDecision,
  Street,
  StreetSnapshot,
  Suit,
  TrainingScenario,
} from '../types'

export interface PokerBenchRecord {
  id: string
  kind: 'preflop' | 'postflop'
  preflopAction?: string
  postflopAction?: string
  boardFlop?: string
  boardTurn?: string
  boardRiver?: string
  evaluationAt?: string
  heroPosition: string
  holding: string
  availableMoves: string[]
  potSize: number
  correctDecision: string
}

const positions: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']
const postflopOrder: Position[] = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN']

const suitMap: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
}

const rankMap: Record<string, Rank> = {
  A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10',
  '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
}

const cleanPosition = (value: string) => value.replace(/\s/g, '') as Position

export function parseCards(value = ''): CardValue[] {
  return value.replace(/\s/g, '').match(/.{2}/g)?.flatMap((token) => {
    const rank = rankMap[token[0]?.toUpperCase()]
    const suit = suitMap[token[1]?.toLowerCase()]
    return rank && suit ? [{ rank, suit }] : []
  }) ?? []
}

function parseDecision(label: string): ReferenceDecision {
  const normalized = label.trim()
  if (normalized.toLowerCase() === 'allin') {
    return { action: 'raise', amount: 100, label: 'All-in' }
  }

  const numericRaise = Number(normalized.replace(/\s*bb/i, ''))
  if (Number.isFinite(numericRaise)) {
    return { action: 'raise', amount: numericRaise, label: `Raise to ${numericRaise} BB` }
  }

  const [verb, rawAmount] = normalized.split(/\s+/)
  const action = verb.toLowerCase() as PokerAction
  const amount = rawAmount ? Number(rawAmount.replace(/bb/i, '')) : undefined
  return { action, amount: Number.isFinite(amount) ? amount : undefined, label: normalized }
}

function parseAvailableActions(moves: string[]): AvailableAction[] {
  return moves.map((move) => {
    const decision = parseDecision(move)
    return {
      action: decision.action,
      label: decision.label === 'All-in'
        ? decision.label
        : decision.action[0].toUpperCase() + decision.action.slice(1),
      amount: decision.amount,
    }
  })
}

function preflopActors(action = ''): Position[] {
  const found = action.split('/').filter((token) => positions.includes(cleanPosition(token)))
    .map(cleanPosition)
  return [...new Set(found)]
}

interface BettingState {
  contributions: Map<Position, number>
  folded: Set<Position>
  currentActions: Map<Position, string>
  roundCommitted: Map<Position, number>
  currentBet: number
  lastFullRaiseSize: number
}

interface DerivedStreetState {
  state: BettingState
  actions: string[]
}

function createBettingState(): BettingState {
  return {
    contributions: new Map<Position, number>([['SB', 0.5], ['BB', 1]]),
    folded: new Set<Position>(),
    currentActions: new Map<Position, string>(),
    roundCommitted: new Map<Position, number>([['SB', 0.5], ['BB', 1]]),
    currentBet: 1,
    lastFullRaiseSize: 1,
  }
}

function startNextStreet(state: BettingState) {
  state.roundCommitted = new Map()
  state.currentActions = new Map()
  state.currentBet = 0
  state.lastFullRaiseSize = 1
}

function cloneBettingState(state: BettingState): BettingState {
  return {
    contributions: new Map(state.contributions),
    folded: new Set(state.folded),
    currentActions: new Map(state.currentActions),
    roundCommitted: new Map(state.roundCommitted),
    currentBet: state.currentBet,
    lastFullRaiseSize: state.lastFullRaiseSize,
  }
}

function commitTo(state: BettingState, position: Position, target: number) {
  const alreadyCommitted = state.roundCommitted.get(position) ?? 0
  const delta = Math.max(0, target - alreadyCommitted)
  state.roundCommitted.set(position, target)
  state.contributions.set(position, (state.contributions.get(position) ?? 0) + delta)
  state.currentBet = Math.max(state.currentBet, target)
  return delta
}

function applyAction(state: BettingState, position: Position, rawAction: string) {
  const action = rawAction.replace(/\s/g, '').toLowerCase()
  const numericAmount = Number(action.replace(/bb$/, ''))

  if (Number.isFinite(numericAmount)) {
    const previousBet = state.currentBet
    commitTo(state, position, numericAmount)
    const raiseSize = numericAmount - previousBet
    if (raiseSize >= state.lastFullRaiseSize) state.lastFullRaiseSize = raiseSize
    state.currentActions.set(position, `Raised to ${numericAmount} BB`)
    return
  }

  if (action === 'check') {
    state.currentActions.set(position, 'Checked')
    return
  }

  if (action === 'fold') {
    state.folded.add(position)
    state.currentActions.set(position, 'Folded')
    return
  }

  if (action === 'call') {
    commitTo(state, position, state.currentBet)
    state.currentActions.set(position, 'Called')
    return
  }

  if (action === 'allin') {
    const remainingStack = Math.max(0, 100 - (state.contributions.get(position) ?? 0))
    const target = (state.roundCommitted.get(position) ?? 0) + remainingStack
    const previousBet = state.currentBet
    commitTo(state, position, target)
    const raiseSize = target - previousBet
    if (raiseSize >= state.lastFullRaiseSize) state.lastFullRaiseSize = raiseSize
    state.currentActions.set(position, 'All-in')
    return
  }

  const match = action.match(/^(bet|raise)_(\d+(?:\.\d+)?)$/)
  if (match) {
    const amount = Number(match[2])
    const previousBet = state.currentBet
    commitTo(state, position, amount)
    const raiseSize = amount - previousBet
    if (raiseSize >= state.lastFullRaiseSize) state.lastFullRaiseSize = raiseSize
    state.currentActions.set(position, match[1] === 'bet' ? `Bet ${amount} BB` : `Raised to ${amount} BB`)
  }
}

function legalActionsFor(record: PokerBenchRecord, state: BettingState, heroPosition: Position): AvailableAction[] {
  const benchmarkActions = parseAvailableActions(record.availableMoves)
  const heroContribution = state.contributions.get(heroPosition) ?? 0
  const heroCommitted = state.roundCommitted.get(heroPosition) ?? 0
  const remainingStack = Math.max(0, 100 - heroContribution)
  const amountToCall = Math.min(remainingStack, Math.max(0, state.currentBet - heroCommitted))
  const facingWager = amountToCall > 0
  const canFold = facingWager || benchmarkActions.some(({ action }) => action === 'fold')
  const hasAggressiveOption = benchmarkActions.some(({ action }) => action === 'bet' || action === 'raise')
  const actions: AvailableAction[] = []

  if (canFold) actions.push({ action: 'fold', label: 'Fold' })

  if (facingWager) {
    actions.push({ action: 'call', label: 'Call', amount: amountToCall })
  } else {
    actions.push({ action: 'check', label: 'Check' })
  }

  if (hasAggressiveOption) {
    const action: PokerAction = record.kind === 'preflop' || state.currentBet > 0 ? 'raise' : 'bet'
    const max = heroCommitted + remainingStack
    const minimumFullRaise = state.currentBet + state.lastFullRaiseSize
    const min = action === 'bet' ? Math.min(1, max) : Math.min(minimumFullRaise, max)

    if (max > state.currentBet) {
      actions.push({
        action,
        label: action === 'bet' ? 'Bet' : 'Raise',
        min,
        max,
      })
    }
  }

  return actions
}

function deriveBettingState(record: PokerBenchRecord, heroPosition: Position) {
  const state = createBettingState()
  const preflopTokens = (record.preflopAction ?? '').split('/').filter(Boolean)
  const preflopActions: string[] = []

  for (let index = 0; index < preflopTokens.length; index += 2) {
    const position = cleanPosition(preflopTokens[index])
    const action = preflopTokens[index + 1]
    if (positions.includes(position) && action) {
      applyAction(state, position, action)
      const status = state.currentActions.get(position)
      if (status) preflopActions.push(`${position} ${status.toLowerCase()}`)
    }
  }

  const actors = preflopActors(record.preflopAction)
  const participants = [...new Set([...actors.filter((position) => !state.folded.has(position)), heroPosition])]
  const streetStates: Partial<Record<Street, DerivedStreetState>> = {
    Preflop: {
      state: cloneBettingState(state),
      actions: preflopActions.length ? preflopActions : ['Action folds to hero'],
    },
  }

  if (record.kind === 'postflop') {
    startNextStreet(state)
    const ordered = [...participants].sort((a, b) => postflopOrder.indexOf(a) - postflopOrder.indexOf(b))
    const roleMap: Record<string, Position | undefined> = {
      OOP: ordered[0],
      IP: ordered.at(-1),
    }
    const postflopTokens = (record.postflopAction ?? '').split('/').filter(Boolean)
    let skipDealtCard = false
    let currentStreet: Street = 'Flop'
    let currentStreetActions: string[] = []

    for (const token of postflopTokens) {
      if (token.toLowerCase() === 'dealcards') {
        streetStates[currentStreet] = {
          state: cloneBettingState(state),
          actions: [...currentStreetActions],
        }
        currentStreet = currentStreet === 'Flop' ? 'Turn' : 'River'
        startNextStreet(state)
        currentStreetActions = []
        skipDealtCard = true
        continue
      }
      if (skipDealtCard) {
        skipDealtCard = false
        continue
      }

      const [role, ...actionParts] = token.split('_')
      const position = roleMap[role]
      if (position && actionParts.length) {
        applyAction(state, position, actionParts.join('_'))
        const status = state.currentActions.get(position)
        if (status) currentStreetActions.push(`${position} ${status.toLowerCase()}`)
      }
    }

    streetStates[currentStreet] = {
      state: cloneBettingState(state),
      actions: [...currentStreetActions],
    }
  }

  return { ...state, participants, streetStates }
}

function actualPostflopHero(record: PokerBenchRecord, participants: Position[]): Position {
  const ordered = [...participants].sort((a, b) => postflopOrder.indexOf(a) - postflopOrder.indexOf(b))
  if (record.heroPosition === 'OOP') return ordered[0] ?? 'BB'
  return ordered.at(-1) ?? 'BTN'
}

function formatToken(token: string) {
  if (/^-?\d+(\.\d+)?\s*bb$/i.test(token)) return `to ${token.replace(/\s/g, '').toUpperCase()}`
  return token.replaceAll('_', ' ').toLowerCase()
}

function formatHistory(record: PokerBenchRecord): string[] {
  const preflopTokens = (record.preflopAction ?? '').split('/').filter(Boolean)
  const preflop = [] as string[]
  for (let index = 0; index < preflopTokens.length; index += 2) {
    const actor = cleanPosition(preflopTokens[index])
    const action = preflopTokens[index + 1]
    if (actor && action) preflop.push(`${actor} ${formatToken(action)}`)
  }

  if (record.kind === 'preflop') return preflop.length ? preflop : ['Action folds to hero']

  const postflop = (record.postflopAction ?? '').split('/').filter(Boolean).map((token) => {
    if (token.toLowerCase() === 'dealcards') return 'Next street dealt'
    const [actor, ...rest] = token.split('_')
    return `${actor} ${rest.join(' ').toLowerCase()}`
  })

  return [...preflop, `${record.evaluationAt} decision`, ...postflop].slice(-7)
}

function boardFor(record: PokerBenchRecord): CardValue[] {
  if (record.kind === 'preflop') return []
  const cards = [record.boardFlop ?? '']
  if (record.evaluationAt === 'Turn' || record.evaluationAt === 'River') cards.push(record.boardTurn ?? '')
  if (record.evaluationAt === 'River') cards.push(record.boardRiver ?? '')
  return parseCards(cards.join(''))
}

function boardForStreet(record: PokerBenchRecord, street: Street): CardValue[] {
  if (street === 'Preflop') return []
  const cards = [record.boardFlop ?? '']
  if (street === 'Turn' || street === 'River') cards.push(record.boardTurn ?? '')
  if (street === 'River') cards.push(record.boardRiver ?? '')
  return parseCards(cards.join(''))
}

function potFromState(state: BettingState) {
  return [...state.contributions.values()].reduce((total, contribution) => total + contribution, 0)
}

function contextLabel(record: PokerBenchRecord, participants: Position[]) {
  const matchup = participants.length >= 2 ? `${participants[0]} vs ${participants.at(-1)}` : record.heroPosition
  const raises = (record.preflopAction?.match(/\d+(\.\d+)?\s*bb/gi) ?? []).length
  const potType = raises >= 2 ? '3-bet pot' : raises === 1 ? 'Single-raised pot' : 'Unopened pot'
  return `${matchup} · ${potType}`
}

export function toTrainingScenario(record: PokerBenchRecord, handNumber: number): TrainingScenario {
  const actors = preflopActors(record.preflopAction)
  const heroPosition = record.kind === 'preflop'
    ? cleanPosition(record.heroPosition)
    : actualPostflopHero(record, actors)

  const bettingState = deriveBettingState(record, heroPosition)
  const participants = bettingState.participants

  const seatsForState = (state: BettingState): PlayerSeat[] => positions.map((position) => {
    const isHero = position === heroPosition
    const isParticipant = participants.includes(position)
    return {
      position,
      name: isHero ? 'You' : position,
      stack: Math.max(0, 100 - (state.contributions.get(position) ?? 0)),
      isHero,
      isActive: isHero,
      isDealer: position === 'BTN',
      cards: isHero ? parseCards(record.holding) : undefined,
      status: state.currentActions.get(position) ?? (isParticipant ? undefined : 'Folded'),
    }
  })

  const seats = seatsForState(bettingState)

  const street = record.kind === 'preflop' ? 'Preflop' : (record.evaluationAt as TrainingScenario['street'])
  const streetSnapshots = Object.fromEntries(
    Object.entries(bettingState.streetStates).map(([snapshotStreet, derived]) => {
      const typedStreet = snapshotStreet as Street
      const snapshot: StreetSnapshot = {
        street: typedStreet,
        pot: typedStreet === street ? record.potSize : potFromState(derived.state),
        board: boardForStreet(record, typedStreet),
        seats: seatsForState(derived.state),
        actionHistory: derived.actions,
      }
      return [typedStreet, snapshot]
    }),
  ) as Partial<Record<Street, StreetSnapshot>>

  return {
    id: record.id,
    source: 'pokerbench',
    street,
    handNumber,
    totalHands: 10,
    blinds: [0.5, 1],
    pot: record.potSize,
    board: boardFor(record),
    seats,
    actionHistory: streetSnapshots[street]?.actionHistory ?? formatHistory(record),
    availableActions: legalActionsFor(record, bettingState, heroPosition),
    prompt: `${street} action is on you`,
    contextLabel: contextLabel(record, participants),
    effectiveStack: 100,
    referenceDecision: parseDecision(record.correctDecision),
    streetSnapshots,
  }
}

export async function loadPokerBenchSample(): Promise<PokerBenchRecord[]> {
  const response = await fetch('/data/pokerbench-sample.json')
  if (!response.ok) throw new Error(`PokerBench sample failed to load (${response.status})`)
  return response.json() as Promise<PokerBenchRecord[]>
}
