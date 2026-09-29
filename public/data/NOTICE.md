# PokerBench sample

`pokerbench-sample.json` is a deterministic 500-row sample generated from the PokerBench preflop and postflop test CSV files.

- Source: https://huggingface.co/datasets/RZ412/PokerBench
- License: Apache-2.0
- Paper: PokerBench: Training Large Language Models to Become Professional Poker Players (AAAI 2025)
- Rebuild: `npm run data:build`

The original PokerBench labels identify a reference action. They do not include full action frequencies or per-action expected values, so this application does not describe them as EV-loss measurements.
