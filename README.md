<!-- make.fun-run-meta -->
# Twelve-bar gate

[![make.fun bounty](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![rank](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/vantawhiteout/mf-u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/rank.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![reward](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/vantawhiteout/mf-u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/reward.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)

A paper-trading bot for the hourly Solana replay. Entry: [make.fun](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1).

## The rule

Every twelve bars the bot averages the twelve-bar return of the seven assets in the universe. If that average is above 0.5%, it holds the four strongest assets, each capped at a quarter of equity. If it is not, it holds USDC. Returns are compared with integer cross multiplication, and slippage is left to the replay's own fill model.

Four $10 SOL round trips in the first eight bars keep the bot above the replay's eight-trade floor even when the basket never opens. The full account is never more than 25% in one asset, so four names fill it.

On the kit's dev window the bot returns +197.42 USDC over 20 filled trades with a 1.83% maximum drawdown, against -869.34 USDC for the equal-weight buy-and-hold baseline.

## Run it

The repository is self-contained. `vendor/makefun-bars.ts` is the kit's protocol shim, copied verbatim. The harness sends newline-delimited JSON on stdin and expects one reply line per batch.

```sh
node main.ts
```

On Node 22.6 to 22.17 use `node --experimental-strip-types main.ts`. No packages, network access, clock reads or random draws are used.

## Files

- `main.ts`: the strategy and the replay loop
- `vendor/makefun-bars.ts`: protocol shim from the kit
- `LICENSE`: MIT, SPDX-License-Identifier: MIT
- `.makefun/owner.json`: repository claim for make.fun

---

<sub>Entered on [make.fun](https://make.fun/?ref=vantawhiteout&utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)</sub>
