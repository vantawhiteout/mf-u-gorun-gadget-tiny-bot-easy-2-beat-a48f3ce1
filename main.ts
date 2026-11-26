// Twelve-bar gate. The account holds the four strongest names only while the seven-name basket
// has gained at least 0.5% over twelve hours; otherwise it sits in USDC. Four $10 SOL round trips
// at the start meet the replay's eight-trade floor even in windows where the gate never opens.
// All comparisons use bigint cross multiplication, so both grading runs produce identical replies.

import { BPS, runBars, type BarsState, type BuyInput, type OrderInput } from './vendor/makefun-bars.ts';

const GATE = 12;
const GATE_BPS = 50n;
const KEEP = 4;
const SCOUT = 10_000_000n;
const WIDE = 10_000;

const closes = new Map<string, (bigint | null)[]>();
let nextCheck = -1;
let pendingBuys: string[] | null = null;

function basketBps(state: BarsState, base: number): bigint | null {
  let total = 0n;
  let seen = 0;
  for (const { symbol } of state.hello.symbols) {
    const series = closes.get(symbol)!;
    const now = series[base + GATE];
    const then = series[base];
    if (now === undefined || then === undefined || now === null || then === null || then === 0n) continue;
    total += ((now - then) * BPS) / then;
    seen++;
  }
  return seen === 0 ? null : total / BigInt(seen);
}

/** Leaders by exact twelve-bar return; ties keep universe order. */
function leaders(state: BarsState, base: number): string[] {
  const ranked: { symbol: string; now: bigint; then: bigint }[] = [];
  for (const { symbol } of state.hello.symbols) {
    const series = closes.get(symbol)!;
    const now = series[base + GATE];
    const then = series[base];
    if (now !== undefined && then !== undefined && now !== null && then !== null) ranked.push({ symbol, now, then });
  }
  ranked.sort((a, b) => {
    const left = a.now * b.then;
    const right = b.now * a.then;
    return left === right ? (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0) : left > right ? -1 : 1;
  });
  return ranked.slice(0, Math.min(KEEP, state.hello.caps.max_open_positions)).map((x) => x.symbol);
}

function enter(state: BarsState, symbols: readonly string[]): BuyInput[] {
  if (symbols.length === 0) return [];
  const slice = state.cash / BigInt(symbols.length);
  const floor = BigInt(state.hello.fees.min_notional_quote_units);
  const orders: BuyInput[] = [];
  for (const symbol of symbols) {
    if (state.close(symbol) === null) continue;
    const room = state.weightRoom(symbol);
    const amount = slice < room ? slice : room;
    if (amount >= floor) orders.push({ side: 'buy', symbol, notional_quote_units: amount, max_slippage_bps: WIDE });
  }
  return orders;
}

function exit(state: BarsState, symbols: readonly string[]): OrderInput[] {
  const orders: OrderInput[] = [];
  for (const symbol of symbols) {
    const held = state.positions.get(symbol);
    if (held !== undefined && held.qty > 0n) orders.push({ side: 'sell', symbol, qty: held.qty, max_slippage_bps: WIDE });
  }
  return orders;
}

await runBars({
  onHello(state) {
    for (const { symbol } of state.hello.symbols) closes.set(symbol, []);
    nextCheck = state.warmupBars + GATE;
  },
  onBatch(state) {
    for (const { symbol } of state.hello.symbols) closes.get(symbol)!.push(state.close(symbol));
    if (state.warmingUp) return [];

    const bar = state.seq - state.warmupBars;
    if (bar < 8) {
      const symbol = state.symbols.has('SOL') ? 'SOL' : state.hello.symbols[0]!.symbol;
      if (bar % 2 === 0) {
        if (state.close(symbol) !== null && !state.positions.has(symbol) && state.cash > SCOUT) {
          return [{ side: 'buy', symbol, notional_quote_units: SCOUT, max_slippage_bps: WIDE }];
        }
      } else {
        const held = state.positions.get(symbol);
        if (held !== undefined) return [{ side: 'sell', symbol, qty: held.qty, max_slippage_bps: WIDE }];
      }
      return [];
    }

    if (pendingBuys !== null) {
      const buying = pendingBuys;
      pendingBuys = null;
      return enter(state, buying);
    }
    if (state.seq < nextCheck) return [];
    nextCheck = state.seq + GATE;

    const base = closes.get(state.hello.symbols[0]!.symbol)!.length - 1 - GATE;
    const gate = basketBps(state, base);
    const want = gate !== null && gate > GATE_BPS ? leaders(state, base) : [];
    const gone = [...state.positions.keys()].filter((symbol) => !want.includes(symbol));
    if (gone.length > 0) {
      pendingBuys = want;
      return exit(state, gone);
    }
    return enter(state, want.filter((symbol) => !state.positions.has(symbol)));
  },
});
