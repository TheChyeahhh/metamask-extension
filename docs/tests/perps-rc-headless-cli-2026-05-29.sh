#!/usr/bin/env bash
# Perps RC headless automation — v13.34.0 — 2026-05-29
# Reproduces the unattended mm CLI flow against CI webpack chrome build.
set -uo pipefail

AUTOMATION_MODE=true
BUILD_URL="${BUILD_URL:-https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/26597247205/build-dist-webpack/builds/metamask-chrome-13.34.0.zip}"
BUILD_SOURCE_SHA="${BUILD_SOURCE_SHA:-99202a7e088ffaec0b47f64bfc9211b2f5efe398}"
RUN_ID="${RUN_ID:-perps-rc-13.34.0-2026-05-29}"
WORK_ROOT="${WORK_ROOT:-/tmp/metamask-mm-${RUN_ID}}"
SCREENSHOT_DIR="${SCREENSHOT_DIR:-${WORK_ROOT}/screenshots}"
REPORT_PATH="docs/tests/perps-rc-headless-report-2026-05-29.md"
TEST_PASSWORD="${TEST_PASSWORD:-correct horse battery staple}"
BACKEND_MODE="${BACKEND_MODE:-live-real-funds}"
USE_FIXTURES="${USE_FIXTURES:-false}"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24.13.1 >/dev/null
export PATH="$NVM_DIR/versions/node/v24.13.1/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
MM=./node_modules/.bin/mm
mkdir -p "$WORK_ROOT" "$SCREENSHOT_DIR"

# --- Resolve & unpack build ---
curl -fsSL "$BUILD_URL" -o "${WORK_ROOT}/extension.zip"
unzip -q -o "${WORK_ROOT}/extension.zip" -d "${WORK_ROOT}/extension"
MANIFEST_PATH="$(/usr/bin/find "${WORK_ROOT}/extension" -name manifest.json | head -1)"
EXTENSION_PATH="$(dirname "$MANIFEST_PATH")"
if [[ "$USE_FIXTURES" != "true" ]]; then
  python3 - <<'PY' "$MANIFEST_PATH"
import json, sys
p = sys.argv[1]
with open(p) as f:
    m = json.load(f)
testing = m.setdefault("_flags", {}).setdefault("testing", {})
testing.pop("fixtureServerPort", None)
with open(p, "w") as f:
    json.dump(m, f, indent=2)
PY
fi

# --- Source worktree (optional) ---
git worktree add "${WORK_ROOT}/src-${BUILD_SOURCE_SHA:0:7}" "$BUILD_SOURCE_SHA" 2>/dev/null || true

# --- Launch ---
$MM cleanup --shutdown >/dev/null 2>&1 || true
$MM launch --context prod --state onboarding --force \
  --extension-path "$EXTENSION_PATH" \
  --goal "perps-rc headless smoke/regression" \
  --flow-tags "perps-rc,headless,smoke,regression,automation"

EXT_ID="$($MM describe-screen 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['state']['extensionId'])")"
BASE="chrome-extension://${EXT_ID}/home.html"

# --- Onboarding (SRP from AI_CLI_SRP; never log secret) ---
$MM click unused --testid onboarding-import-wallet
$MM click unused --testid onboarding-import-with-srp-button
$MM clipboard write "${AI_CLI_SRP:?AI_CLI_SRP required}"
$MM click unused --testid srp-input-import__paste-button
$MM click unused --testid import-srp-confirm
python3 - <<'PY'
import json, subprocess, os
pw = os.environ.get("TEST_PASSWORD", "correct horse battery staple")
expr = f"""(async () => {{
  const setVal = (testId, value) => {{
    const el = document.querySelector(`[data-testid="${{testId}}"] input, [data-testid="${{testId}}"]`);
    if (!el) return false;
    const input = el.matches('input') ? el : el.querySelector('input');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', {{ bubbles: true }}));
    input.dispatchEvent(new Event('change', {{ bubbles: true }}));
    return true;
  }};
  const terms = document.querySelector('#create-password-terms, [data-testid="create-password-terms"] input');
  if (terms && !terms.checked) terms.click();
  setVal('create-password-new-input', {json.dumps(pw)});
  setVal('create-password-confirm-input', {json.dumps(pw)});
  await new Promise((r) => setTimeout(r, 400));
  return {{ ok: true }};
}})()"""
open('/tmp/cdp-pw.json','w').write(json.dumps({"expression":expr,"awaitPromise":True,"returnByValue":True}))
PY
$MM cdp Runtime.evaluate "$(cat /tmp/cdp-pw.json)"
$MM click unused --testid create-password-submit
$MM click unused --testid passkey-maybe-later-button
$MM click unused --testid metametrics-i-agree
$MM click unused --testid onboarding-complete-done || $MM navigate "${BASE}#/"

# --- Perps smoke (read-only + validation) ---
$MM navigate "${BASE}#/?tab=perps"
$MM click unused --testid perps-tutorial-skip-button || true
$MM wait-for unused --testid perps-view --timeout 45000
$MM click unused --testid perps-balance-dropdown || true
$MM navigate "${BASE}#/perps/market-list"
$MM wait-for unused --testid market-list-view --timeout 45000
$MM navigate "${BASE}#/perps/market/BTC"
$MM click unused --testid perps-long-cta-button || true
$MM type unused 1 --selector '[data-testid="amount-input-field"] input' || true
$MM click unused --testid order-type-limit || true
$MM navigate "${BASE}#/perps/activity"

# --- Live setup (mutating; requires ~$10+ Perps balance) ---
# order_market BTC/ETH/SP500 helpers omitted when balance < minimum — see report.

# --- Mandatory teardown (same session) ---
for sym in BTC "xyz:SP500"; do
  $MM navigate "${BASE}#/perps/market/${sym}" || true
  $MM click unused --testid perps-close-cta-button || true
  $MM click unused --testid close-amount-slider-pct-100 || true
  $MM click unused --testid perps-close-position-modal-submit || true
  sleep 15
done
$MM navigate "${BASE}#/?tab=perps"

$MM cleanup --shutdown
echo "Done. See ${REPORT_PATH}"
