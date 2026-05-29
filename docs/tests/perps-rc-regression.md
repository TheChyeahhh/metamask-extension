# Perps RC Regression Checklist

## Automation prerequisite (live wallet)

Perps **available balance** may show ~$1.50–$2.00 USDC. Headless live setup still
runs at **$10 notional** with **maximum market leverage** (BTC 40x, ETH 25x,
SP500 50x) so margin stays sub-dollar. Do not skip mutating Critical cases based
on balance dropdown alone — attempt submit with max leverage first. See
`docs/tests/headless-mm-session-prompt-perps-rc.md`.

**Screenshots:** name files with test code + step, e.g.
`perps-rc-13.34.0-2026-05-29-PERPS-RC-061-btc-long-pre-submit-<timestamp>.png`
(not generic `screenshot-*.png`).

## Critical (headless automation scope)

- [ ] [Critical] PERPS-RC-003 — Lock and unlock wallet from Perps home tab
- [ ] [Critical] PERPS-RC-013 — Balance dropdown opens (read-only)
- [ ] [Critical] PERPS-RC-031 — Market list search finds BTC
- [ ] [Critical] PERPS-RC-038 — BTC market detail loads
- [ ] [Critical] PERPS-RC-045 — BTC detail chart/CTA region visible
- [ ] [Critical] PERPS-RC-058 — Order entry blocks $1 below $10 minimum
- [ ] [Critical] PERPS-RC-063 — Limit order mode selectable
- [ ] [Critical] PERPS-RC-061 — BTC long market $10 @ 40x opens position
- [ ] [Critical] PERPS-RC-068 — ETH limit long $10 @ $1900 @ 25x (or Partial if insufficient funds)
- [ ] [Critical] PERPS-RC-062 — SP500 short market $10 @ 50x opens position
- [ ] [Critical] PERPS-RC-077 — Modify position: add exposure flow opens
- [ ] [Critical] PERPS-RC-078 — Modify position: add $10 exposure submits
- [ ] [Critical] PERPS-RC-081 — Reduce exposure $10 minimum on close modal
- [ ] [Critical] PERPS-RC-091 — Auto close TP 10% / SL 5% configuration
- [ ] [Critical] PERPS-RC-097 — Cancel resting ETH limit order if present
- [ ] [Critical] PERPS-RC-108 — Withdraw UI opens from balance dropdown (no submit)
- [ ] [Critical] PERPS-RC-117 — Activity page loads
