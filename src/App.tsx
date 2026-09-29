import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, BookOpen, ChevronDown, Database, Diamond, Flame, Settings, Target } from 'lucide-react'
import { ActionPanel } from './components/ActionPanel'
import { HandContext } from './components/HandContext'
import { PokerTable } from './components/PokerTable'
import { StreetNavigator } from './components/StreetNavigator'
import { demoScenario } from './demoScenario'
import { loadPokerBenchSample, toTrainingScenario, type PokerBenchRecord } from './data/pokerbench'
import type { Street } from './types'

function App() {
  const [decisionCount, setDecisionCount] = useState(0)
  const [handNumber, setHandNumber] = useState(1)
  const [records, setRecords] = useState<PokerBenchRecord[]>([])
  const [scenario, setScenario] = useState(demoScenario)
  const [selectedStreet, setSelectedStreet] = useState<Street>(demoScenario.street)
  const [datasetStatus, setDatasetStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    loadPokerBenchSample()
      .then((loadedRecords) => {
        setRecords(loadedRecords)
        const loadedScenario = toTrainingScenario(loadedRecords[Math.floor(Math.random() * loadedRecords.length)], 1)
        setScenario(loadedScenario)
        setSelectedStreet(loadedScenario.street)
        setDatasetStatus('ready')
      })
      .catch(() => setDatasetStatus('error'))
  }, [])

  const handleDecision = () => {
    setDecisionCount((count) => count + 1)
  }

  const nextScenario = () => {
    if (!records.length) return
    const nextHand = handNumber >= 10 ? 1 : handNumber + 1
    let nextRecord = records[Math.floor(Math.random() * records.length)]
    if (records.length > 1 && nextRecord.id === scenario.id) {
      nextRecord = records[(records.indexOf(nextRecord) + 1) % records.length]
    }
    setHandNumber(nextHand)
    const loadedScenario = toTrainingScenario(nextRecord, nextHand)
    setScenario(loadedScenario)
    setSelectedStreet(loadedScenario.street)
  }

  const selectedSnapshot = scenario.streetSnapshots?.[selectedStreet]
  const heroHolding = scenario.seats.find((seat) => seat.isHero)?.cards
  const displayedScenario = selectedSnapshot
    ? {
        ...scenario,
        ...selectedSnapshot,
        seats: selectedSnapshot.seats.map((seat) => seat.isHero
          ? { ...seat, cards: heroHolding }
          : seat),
      }
    : scenario
  const isReviewingHistory = selectedStreet !== scenario.street

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-white/10 bg-ink/90 px-[clamp(20px,4vw,64px)] backdrop-blur-xl max-md:h-[62px] max-md:px-4 max-md:backdrop-blur-none">
        <a className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.8px]" href="#" aria-label="RangeLab home">
          <span className="grid size-[34px] rotate-[6deg] place-items-center rounded-[10px] bg-lime-accent text-[#10150f]"><Diamond className="-rotate-[6deg]" size={20} fill="currentColor" /></span>
          <span>Range<span className="text-lime-accent">Lab</span></span>
        </a>
        <nav className="ml-[clamp(35px,7vw,110px)] flex h-full gap-2 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:ml-0 max-md:h-[58px] max-md:justify-around max-md:border-t max-md:border-white/10 max-md:bg-[#0e1312]" aria-label="Primary navigation">
          <a className="relative flex items-center gap-2 px-4 text-[13px] font-bold text-white after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:bg-lime-accent max-md:flex-1 max-md:justify-center max-md:text-[10px]" href="#trainer"><Target size={17} /> Trainer</a>
          <a className="flex items-center gap-2 px-4 text-[13px] font-bold text-[#85918d] transition hover:text-white max-md:flex-1 max-md:justify-center max-md:text-[10px]" href="#study"><BookOpen size={17} /> Study</a>
          <a className="flex items-center gap-2 px-4 text-[13px] font-bold text-[#85918d] transition hover:text-white max-md:flex-1 max-md:justify-center max-md:text-[10px]" href="#progress"><BarChart3 size={17} /> Progress</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="mr-1 flex items-center gap-1.5 border-r border-white/10 pr-[18px] text-xs font-bold text-[#d8dedb] max-md:hidden"><Flame className="text-[#f2a65a]" size={16} fill="currentColor" /> 4 day streak</div>
          <button className="grid size-[38px] place-items-center rounded-xl border border-white/10 bg-[#121816] max-[480px]:hidden" aria-label="Settings"><Settings size={18} /></button>
          <button className="grid size-[38px] place-items-center rounded-xl bg-[#e3e9e5] text-xs font-extrabold text-[#162019]" aria-label="Open profile">RC</button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-[clamp(18px,3vw,48px)] pb-12 max-md:pb-20">
        <section className="grid min-h-24 grid-cols-[1fr_minmax(260px,390px)_1fr] items-center gap-7 border-b border-white/10 max-md:min-h-[82px] max-md:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3">
            <span className="size-[7px] rounded-full bg-lime-accent shadow-[0_0_0_5px_rgba(200,247,99,.08),0_0_12px_rgba(200,247,99,.7)]" />
            <div><span className="eyebrow">Practice session</span><h1 className="mt-1 text-[17px] leading-none font-bold max-[480px]:text-sm">PokerBench random</h1></div>
            <button className="text-[#85918d]"><ChevronDown size={16} /></button>
          </div>
          <div className="max-md:hidden">
            <div className="mb-[9px] flex justify-between text-[11px] text-[#85918d]"><span>Hand {handNumber} of 10</span><strong className="font-semibold text-[#ccd3cf]">{decisionCount} decisions</strong></div>
            <div className="h-1 overflow-hidden rounded-full bg-[#1c2421]"><span className="block h-full rounded-[inherit] bg-lime-accent shadow-[0_0_8px_rgba(200,247,99,.45)]" style={{ width: `${handNumber * 10}%` }} /></div>
          </div>
          <button className="justify-self-end rounded-[9px] border border-white/10 bg-transparent px-[15px] py-2.5 text-[11px] font-bold text-[#a5afab]">End session</button>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-[clamp(20px,3vw,42px)] pt-[34px] max-[1040px]:grid-cols-1">
          <div className="min-w-0">
            {datasetStatus !== 'ready' && (
              <div className={`dataset-banner ${datasetStatus}`}>
                <Database size={15} />
                {datasetStatus === 'loading' ? 'Loading PokerBench scenarios…' : 'PokerBench sample unavailable—showing the local demo.'}
              </div>
            )}
            {scenario.street !== 'Preflop' && (
              <StreetNavigator currentStreet={scenario.street} selectedStreet={selectedStreet} onSelect={setSelectedStreet} />
            )}
            <PokerTable scenario={displayedScenario} />
            {isReviewingHistory ? (
              <section className="history-review-panel">
                <div>
                  <span className="eyebrow">Reviewing hand history</span>
                  <h2>{selectedStreet} table state</h2>
                  <p>Stacks, pot, board, and action badges are frozen at the end of this street.</p>
                </div>
                <button onClick={() => setSelectedStreet(scenario.street)}>
                  Return to {scenario.street} <ArrowRight size={17} />
                </button>
              </section>
            ) : (
              <ActionPanel key={scenario.id} scenario={scenario} onDecision={handleDecision} onNext={nextScenario} />
            )}
          </div>
          <HandContext scenario={displayedScenario} />
        </div>
      </main>
    </div>
  )
}

export default App
