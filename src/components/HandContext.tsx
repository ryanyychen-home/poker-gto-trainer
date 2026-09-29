import { ChevronDown, CircleHelp } from 'lucide-react'
import type { TrainingScenario } from '../types'

export function HandContext({ scenario }: { scenario: TrainingScenario }) {
  return (
    <aside className="border-l border-white/10 pl-7 max-[1040px]:grid max-[1040px]:grid-cols-2 max-[1040px]:gap-6 max-[1040px]:border-t max-[1040px]:border-l-0 max-[1040px]:pt-6 max-[1040px]:pl-0 max-md:grid-cols-1">
      <div className="flex items-start justify-between border-b border-white/10 pb-[19px] max-[1040px]:col-span-full max-md:col-span-1">
        <div>
          <span className="eyebrow">Hand context</span>
          <h3 className="mt-1.5 text-[13px] leading-[1.4] font-bold">{scenario.contextLabel}</h3>
        </div>
        <button className="border-0 bg-transparent text-[#85918d]" aria-label="Collapse hand context"><ChevronDown size={18} /></button>
      </div>
      <dl className="my-5 grid grid-cols-2 gap-x-3 gap-y-[18px] max-[1040px]:m-0">
        <div className="flex flex-col gap-1"><dt className="text-[9px] text-[#67726e]">Format</dt><dd className="m-0 font-mono text-[10px] text-[#cbd2cf]">6-max cash</dd></div>
        <div className="flex flex-col gap-1"><dt className="text-[9px] text-[#67726e]">Effective stack</dt><dd className="m-0 font-mono text-[10px] text-[#cbd2cf]">{scenario.effectiveStack.toFixed(1)} BB</dd></div>
        <div className="flex flex-col gap-1"><dt className="text-[9px] text-[#67726e]">Blinds</dt><dd className="m-0 font-mono text-[10px] text-[#cbd2cf]">{scenario.blinds[0]} / {scenario.blinds[1]} BB</dd></div>
        <div className="flex flex-col gap-1"><dt className="text-[9px] text-[#67726e]">Source</dt><dd className="m-0 font-mono text-[10px] text-[#d4e6ae]"><i className="mr-1 inline-block size-[5px] rounded-full bg-lime-accent" /> {scenario.source === 'pokerbench' ? 'PokerBench' : 'Demo fixture'}</dd></div>
      </dl>
      <ol className="action-history">
        {scenario.actionHistory.map((action, index) => (
          <li key={`${action}-${index}`} className={index === scenario.actionHistory.length - 1 ? 'current' : ''}>
            <span>{index + 1}</span>{action}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-start gap-2 rounded-[10px] border border-lime-accent/15 bg-lime-accent/5 p-3 text-[#8e9a95] max-[1040px]:col-span-full max-[1040px]:mt-0 max-md:col-span-1">
        <CircleHelp className="shrink-0 text-lime-accent" size={16} />
        <p className="m-0 text-[9px] leading-[1.55]"><strong className="text-[#cad3cf]">Solver estimate.</strong> PokerBench anchors the dominant action; inferred frequencies and EV loss appear after your choice.</p>
      </div>
    </aside>
  )
}
