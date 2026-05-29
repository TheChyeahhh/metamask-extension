# Headless MetaMask MM Session Prompt — Perps RC (Automation)

Use this document as the **source prompt** for unattended Perps RC runs (Slack/CI). Copy the fenced `text` block into the automation message.

````text
You are working in the MetaMask Extension repo.

Parameters:
- AUTOMATION_MODE: true
- BUILD_URL: (auto — resolve; see step 4)
- BUILD_SLACK_URL: <slack-message-url-that-triggered-the-run; also used for thread reply>
- BUILD_SLACK_CHANNEL_ID: (auto — parsed from BUILD_SLACK_URL)
- BUILD_SLACK_THREAD_TS: (auto — parsed from BUILD_SLACK_URL)
- BUILD_GITHUB_COMMENT_URL: <optional-github-pr-comment-url>
- BUILD_SOURCE_REF: (auto from CI metadata when available)
- BUILD_RUN_ID: (auto from build comment or CloudFront path)
- TEST_PLAN_PATH: docs/tests/perps-rc-regression.md
- WALLET_SECRET_ENV_VAR: AI_CLI_SRP
- WALLET_SECRET_KIND: srp
- WALLET_ENV_FILE: test/env.js
- TEST_PASSWORD: correct horse battery staple
- USE_FIXTURES: false
- BROWSER_MODE: headless
- BACKEND_MODE: live-real-funds
- MUTATING_ACTION_POLICY: allowed
- BASE_ROUTE: chrome-extension://<extension-id>/home.html
- START_ROUTE: #/?tab=perps
- TEST_SCOPE_NAME: perps-rc
- REPORT_PATH: docs/tests/perps-rc-headless-report-<YYYY-MM-DD>.md
- SCRIPT_PATH: docs/tests/perps-rc-headless-cli-<YYYY-MM-DD>.sh
- SCREENSHOT_PREFIX: perps-rc-<version>-<YYYY-MM-DD>
- RUN_ID: perps-rc-<version>-<YYYY-MM-DD>
- LIVE_SETUP_PROFILE: minimal-live-trades
- SCREENSHOT_DIR: docs/tests/perps-rc-evidence-<YYYY-MM-DD> (commit evidence to the branch)

## Screenshots — meaningful filenames (required)

Never rely on default `screenshot-<epoch>.png` names. Every `mm screenshot` must
pass **`--name`** (CLI flag; there is no `--path`) with a **human-readable** basename
that includes the **test code** and a short **step slug** from the checklist title.

**`--name` pattern (no `.png`; mm appends `-<epoch>.png`):**

```text
${SCREENSHOT_PREFIX}-<TEST_CODE>-<step-slug>
```

Examples of full filenames after mm saves:

```text
perps-rc-13.34.0-2026-05-29-PERPS-RC-061-btc-long-pre-submit-1780067405773.png
```

- `<TEST_CODE>` — exact checklist id, e.g. `PERPS-RC-061` (always uppercase).
- `<step-slug>` — kebab-case step tied to the case title, e.g.
  `balance-dropdown`, `btc-long-pre-submit`, `eth-limit-submitted`,
  `sp500-short-insufficient`, `modify-add-exposure`, `reduce-position-modal`,
  `auto-close-tp-sl`, `withdraw-page`, `activity-page`, `lock-wallet`, `teardown-btc`.
- Prefer slugs that read like the test name, not `step1` / `done`.

**Examples:**

```bash
mm screenshot --name "perps-rc-13.34.0-2026-05-29-PERPS-RC-061-btc-long-pre-submit"
mm screenshot --name "perps-rc-13.34.0-2026-05-29-PERPS-RC-108-withdraw-page"
```

Screenshots land in `test-artifacts/screenshots/` during the run. After the run,
**copy** (or move) them into `SCREENSHOT_DIR` with the same basenames and **commit**
on the automation branch.

Take at least one screenshot per Critical case executed (Pass/Fail/Partial/Blocked).
Reference the basename (without epoch suffix) in the report Evidence column.

## Low Perps balance (~$1.50–$2.00) — still run live trades

Do **not** skip or Block live setup / position-management cases only because
**Available to trade** shows ~$1.64 USDC (or similar). At max leverage, margin
required for a **$10 notional** order is roughly notional ÷ leverage (e.g. BTC
40x → ~$0.25 margin), which fits sub-$2 wallets.

**Required before every market submit:**
1. Open order entry on the target market route.
2. Set **maximum leverage for that market** in `[data-testid="leverage-input"] input`
   (or drag `leverage-slider` to max) **before** typing size — defaults often stay at 1x.
3. Use the recipe leverage caps below (they match typical maxima on prod).
4. Type **$10** size (minimum notional), then submit.
5. Only mark **Blocked** / **Partial (Insufficient funds)** after a submit attempt
   with max leverage set and `perps-order-submit-error` or visible insufficient-funds copy.
6. Do **not** infer insufficient margin from the balance dropdown alone.

If leverage input shows `x1` after typing, re-focus the field, clear, re-type the
max value, `describe-screen`, screenshot, then submit.

Task:
Run the **Critical** Perps RC cases from TEST_PLAN_PATH against BUILD_URL using
the MetaMask `mm` CLI headlessly. Execute end-to-end without asking the user
questions. Load wallet secrets from WALLET_ENV_FILE/WALLET_SECRET_ENV_VAR; never
print or persist secrets.

When AUTOMATION_MODE is true:
- Do NOT stop for approval on value-moving actions when MUTATING_ACTION_POLICY is `allowed`.
- Do NOT ask for BUILD_URL, BACKEND_MODE, or policy if they can be inferred.
- Do NOT restart the MM daemon mid-run except one recovery relaunch at startup.
- Always run mandatory live teardown in the **same session** before cleanup.
- If a case is blocked, record it and continue with independent cases.
- Always deliver SCRIPT_PATH, REPORT_PATH, screenshots, and cleanup.

Autonomy expectations:
- Run setup → critical read-only cases → live setup trades (if needed) → position
  management → funds UI checks → mandatory teardown → report → cleanup.
- Prefer direct Perps routes and stable testids over brittle explore-markets clicks.
- Trust active tab URL and visible testIds when describe-screen metadata is stale.
- Continue through recoverable harness issues; do not abort the full run for one timeout.

10. Live setup when USE_FIXTURES is false (LIVE_SETUP_PROFILE=minimal-live-trades):
    Use **direct market routes**:
    - `#/perps/market/BTC`
    - `#/perps/market/xyz:SP500` (row testid `market-row-xyz-SP500`)
    - `#/perps/market/ETH`

    Default trade recipe (~$1.50–$2.00 Perps balance — **max leverage required**):
    | Step | Action | Amount | Leverage (set max) | Cases |
    | --- | --- | --- | --- | --- |
    | 1 | BTC long market | $10 | 40x | 061 |
    | 2 | ETH limit long | $10 @ $1900 | 25x | 068 |
    | 3 | SP500 short market | $10 | 50x | 062 |

    Run ETH limit **before** SP500 short when balance is tight.

    Order entry helpers (leverage **before** amount):
    ```bash
    ./node_modules/.bin/mm type unused 40 --selector '[data-testid="leverage-input"] input'
    ./node_modules/.bin/mm type unused 10 --selector '[data-testid="amount-input-field"] input'
    ./node_modules/.bin/mm click unused --testid submit-order-button
    ./node_modules/.bin/mm wait-for --testid perps-position-cta-buttons --timeout 90000
    ```

    Limit order:
    ```bash
    ./node_modules/.bin/mm click unused --testid order-type-limit
    ./node_modules/.bin/mm type unused 1900 --selector '[data-testid="limit-price-input"] input'
    ```

7. Wallet import — clipboard syntax:
    ```bash
    ./node_modules/.bin/mm clipboard write "$AI_CLI_SRP"
    ```
    (Not `mm clipboard write --text`.)

14. Screenshots: follow **Screenshots — meaningful filenames** above; store under
    `SCREENSHOT_DIR` and commit to the automation branch.

Deliverables: SCRIPT_PATH, REPORT_PATH, named screenshots in SCREENSHOT_DIR, Slack
thread summary (include branch link) when BUILD_SLACK_URL set.
````

## Related artifacts

- Checklist: `docs/tests/perps-rc-regression.md`
- Example report: `docs/tests/perps-rc-headless-report-2026-05-29.md`
- Example CLI: `docs/tests/perps-rc-headless-cli-2026-05-29.sh`
