# Perps RC Headless Report — 2026-05-29

## Environment

| Field | Value |
| --- | --- |
| AUTOMATION_MODE | true |
| Extension version | 13.34.0 |
| BUILD_URL | https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/26597247205/build-dist-webpack/builds/metamask-chrome-13.34.0.zip |
| BUILD_RUN_ID | 26597247205 |
| BUILD_SOURCE_SHA | 99202a7e088ffaec0b47f64bfc9211b2f5efe398 |
| BUILD_GITHUB_COMMENT | https://github.com/MetaMask/metamask-extension/pull/43040#issuecomment-4567682116 |
| BUILD_SLACK_THREAD | C08388MPZ9V / 1780066259.459059 |
| BACKEND_MODE | live-real-funds |
| MUTATING_ACTION_POLICY | allowed |
| BROWSER_MODE | headless (Playwright `HEADLESS=true` in llm-workflow) |
| RUN_ID | perps-rc-13.34.0-2026-05-29 |
| WORK_ROOT | /tmp/metamask-mm-perps-rc-13.34.0-2026-05-29 |

## Outcome

**Overall: Partial**

| Metric | Count |
| --- | ---: |
| Critical planned | 17 |
| Executed (Pass/Fail/Partial/Blocked) | 17 |
| Pass | 7 |
| Fail | 0 |
| Partial | 0 |
| Blocked | 10 |
| Not run | 0 |
| Teardown | Pass (no live positions opened) |

Live wallet balance on Perps was ~**1.64 USDC** available to trade, below the **$10** minimum order size. Mutating position-management and live-setup trades were therefore blocked without opening exposure.

## Test Results

| Case | Result | Notes |
| --- | --- | --- |
| PERPS-RC-003 | Blocked | `account-options-menu-button` not reliably available while URL remained `#/onboarding/completion` despite Perps tab content |
| PERPS-RC-013 | Pass | Balance dropdown opened on Perps home |
| PERPS-RC-031 | Pass | `#/perps/market-list` → `market-list-view` |
| PERPS-RC-038 | Pass | `#/perps/market/BTC` detail |
| PERPS-RC-045 | Pass | BTC detail chart/CTA visible |
| PERPS-RC-058 | Pass | “Order size must be at least $10” validation observed |
| PERPS-RC-063 | Pass | Limit order type tab selected |
| PERPS-RC-061 | Blocked | Insufficient margin for $10 BTC market long |
| PERPS-RC-068 | Blocked | Insufficient funds for ETH limit |
| PERPS-RC-062 | Blocked | Insufficient funds for SP500 short |
| PERPS-RC-077 | Blocked | No BTC position |
| PERPS-RC-078 | Blocked | No BTC position |
| PERPS-RC-081 | Blocked | No BTC position |
| PERPS-RC-091 | Blocked | No BTC position |
| PERPS-RC-097 | Blocked | No resting ETH limit |
| PERPS-RC-108 | Blocked | Withdraw CTA not exposed from balance dropdown in this state |
| PERPS-RC-117 | Pass | `#/perps/activity` loads |

## Evidence

Screenshots (mm default dir, copied for reference):

- `docs/tests/perps-rc-evidence-2026-05-29/screenshot-*.png`

## Daemon / Harness Notes

- **Clipboard onboarding fix:** use `mm clipboard write "$SRP"` (not `--text`). Paste button + `import-srp-confirm` then CDP password setter for `create-password-*` fields.
- **Stale route metadata:** `describe-screen` often reported `#/onboarding/completion` while Perps `testId`s were present; direct `#/perps/...` routes were trusted.
- **Slack thread reply:** `slack_send_message` MCP tool not available in this automation runtime; post manually if needed (summary below).

### Suggested Slack reply

```text
:mm_perps: *Perps RC headless — Partial* · v13.34.0

*17/17* Critical cases executed
✅ Pass: 7 · ❌ Fail: 0 · ⚠️ Partial: 0 · 🚫 Blocked: 10 · ⏭ Not run: 0

Build: `13.34.0` · Backend: `live-real-funds` · Teardown: Pass
Report: `docs/tests/perps-rc-headless-report-2026-05-29.md`
```

## Cleanup

- `mm cleanup --shutdown` completed successfully.
- No open Perps positions or resting orders (no qualifying submits).
