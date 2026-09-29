# RangeLab — Poker GTO Trainer

A phased six-max No-Limit Hold'em training app built with React, TypeScript, Vite, and Tailwind CSS v4. The current build includes the full table, PokerBench scenarios, and post-decision policy and EV-loss estimates.

## Roadmap

- **Phase 1 — UI:** responsive six-handed table, board and hole cards, hand context, action history, bet sizing, and complete decision controls.
- **Phase 2 — PokerBench:** complete. The app loads a deterministic local sample of 500 Apache-2.0 PokerBench scenarios, normalizes them into `TrainingScenario`, rotates hero to bottom-center, serves a new random spot after each decision, and reconstructs clickable street-by-street table snapshots.
- **Phase 3 — Solver baseline:** PokerBench-anchored per-action frequency estimates, relative EV loss, decision grades, and explanations behind a replaceable solver interface.
- **Phase 4 — Sessions:** 10-hand, 100-hand, and infinite modes with cumulative EV loss and leak summaries.

## Run locally

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

## Data architecture

The UI consumes a source-neutral `TrainingScenario`. Solver output remains a separate domain object because PokerBench labels contain only the dominant action—not the original mixed strategy, counterfactual EVs, or player ranges. `src/solver/pokerBenchSolver.ts` is therefore explicitly an estimator and can be replaced by a range-aware CFR adapter without changing the trainer UI.

`npm run data:build` downloads the official PokerBench test CSVs and regenerates `public/data/pokerbench-sample.json`. Attribution and licensing details are in `public/data/NOTICE.md`.
