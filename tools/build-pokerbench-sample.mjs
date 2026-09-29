import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://huggingface.co/datasets/RZ412/PokerBench/resolve/main'
const SOURCES = {
  preflop: `${BASE}/preflop_1k_test_set_game_scenario_information.csv`,
  postflop: `${BASE}/postflop_10k_test_set_game_scenario_information.csv`,
}

function parseCsvLine(line) {
  const fields = []
  let field = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      fields.push(field)
      field = ''
    } else {
      field += char
    }
  }
  fields.push(field)
  return fields
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/)
  const headers = parseCsvLine(headerLine).map((header, index) => header || (index === 0 ? 'row_id' : header))
  return lines.map((line) => Object.fromEntries(parseCsvLine(line).map((value, index) => [headers[index], value])))
}

function parseMoves(value) {
  return value.replace(/^\[|\]$/g, '').split(',').map((move) => move.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
}

function evenlySample(rows, count) {
  const step = rows.length / count
  return Array.from({ length: count }, (_, index) => rows[Math.floor(index * step)])
}

async function fetchCsv(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  return parseCsv(await response.text())
}

const [preflopRows, postflopRows] = await Promise.all([
  fetchCsv(SOURCES.preflop),
  fetchCsv(SOURCES.postflop),
])

const preflop = evenlySample(preflopRows, 100).map((row) => ({
  id: `pokerbench-preflop-${row.row_id}`,
  kind: 'preflop',
  preflopAction: row.prev_line,
  heroPosition: row.hero_pos.replace(/\s/g, ''),
  holding: row.hero_holding,
  availableMoves: parseMoves(row.available_moves),
  potSize: Number(row.pot_size),
  correctDecision: row.correct_decision,
}))

const postflop = evenlySample(postflopRows, 400).map((row) => ({
  id: `pokerbench-postflop-${row.row_id}`,
  kind: 'postflop',
  preflopAction: row.preflop_action,
  postflopAction: row.postflop_action,
  boardFlop: row.board_flop,
  boardTurn: row.board_turn,
  boardRiver: row.board_river,
  evaluationAt: row.evaluation_at,
  heroPosition: row.hero_position,
  holding: row.holding,
  availableMoves: parseMoves(row.available_moves),
  potSize: Number(row.pot_size),
  correctDecision: row.correct_decision,
}))

const output = [...preflop, ...postflop]
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(root, 'public/data/pokerbench-sample.json')
await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${output.length} PokerBench scenarios to ${outputPath}`)
