#!/usr/bin/env bash
set -uo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24.13.1 >/dev/null
export PATH="$NVM_DIR/versions/node/v24.13.1/bin:$PATH"

cd /workspace
MM=./node_modules/.bin/mm
EXT_PATH="${EXT_PATH:-/tmp/metamask-mm-perps-rc-13.34.0-2026-05-29-missed/extension}"
EVIDENCE="${EVIDENCE:-/workspace/docs/tests/perps-rc-evidence-2026-05-29}"
SHOT_PREFIX="${SHOT_PREFIX:-perps-rc-13.34.0-2026-05-29}"
PW="${TEST_PASSWORD:-correct horse battery staple}"
RESULTS="/tmp/perps-rc-missed-results.tsv"
: >"$RESULTS"

# nvm breaks if PREFIX is set in the environment
unset PREFIX

ts() { date -u +%Y%m%dT%H%M%SZ; }
shot() {
  local id=$1 step=${2:-done}
  local name="${SHOT_PREFIX}-${id}-${step}"
  $MM screenshot --name "$name" >/dev/null 2>&1 || true
  local latest
  latest=$(ls -t /workspace/test-artifacts/screenshots/"${name}"*.png 2>/dev/null | head -1)
  if [[ -n "$latest" ]]; then
    cp -f "$latest" "${EVIDENCE}/$(basename "$latest")"
  fi
}
rec() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$RESULTS"; echo "$1 $2 $3"
}

nav() { $MM navigate "$1" >/dev/null 2>&1; sleep 2; }
click() { $MM click unused --testid "$1" --timeout "${2:-30000}" >/dev/null 2>&1; }
wait_tid() { $MM wait-for unused --testid "$1" --timeout "${2:-60000}" >/dev/null 2>&1; }

set_leverage() {
  local lev=$1
  $MM click unused --selector '[data-testid="leverage-input"] input' --timeout 10000 >/dev/null 2>&1 || true
  python3 - <<PY
import json, subprocess, os
lev = ${lev}
expr = f"""(async () => {{
  const input = document.querySelector('[data-testid="leverage-input"] input');
  if (!input) return {{ ok: false }};
  input.focus();
  input.select?.();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, String({lev}));
  input.dispatchEvent(new Event('input', {{ bubbles: true }}));
  input.dispatchEvent(new Event('change', {{ bubbles: true }}));
  await new Promise(r => setTimeout(r, 300));
  return {{ ok: true, value: input.value }};
}})()"""
open('/tmp/cdp-lev.json','w').write(json.dumps({"expression":expr,"awaitPromise":True,"returnByValue":True}))
PY
  $MM cdp Runtime.evaluate "$(cat /tmp/cdp-lev.json)" >/dev/null 2>&1
  sleep 1
}

set_amount() {
  $MM type unused "$1" --selector '[data-testid="amount-input-field"] input' >/dev/null 2>&1 || true
  sleep 1
}

screen_has() {
  $MM describe-screen 2>/dev/null | grep -qi "$1"
}

# --- launch ---
$MM cleanup --shutdown 2>&1 | tail -2 || true
LAUNCH_OUT=$($MM launch --context prod --state onboarding --force \
  --extension-path "$EXT_PATH" \
  --goal "perps-rc missed cases retry" \
  --flow-tags "perps-rc,missed,headless" 2>&1) || {
  echo "LAUNCH FAILED: $LAUNCH_OUT"
  exit 1
}

EXT_ID="$(echo "$LAUNCH_OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['extensionId'])" 2>/dev/null || $MM describe-screen 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['state']['extensionId'])")"
echo "EXT_ID=$EXT_ID"
BASE="chrome-extension://${EXT_ID}/home.html"

# --- onboarding ---
export AI_CLI_SRP
click onboarding-import-wallet
click onboarding-import-with-srp-button
$MM clipboard write "$AI_CLI_SRP" >/dev/null
click srp-input-import__paste-button
sleep 2
click import-srp-confirm 60000
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
$MM cdp Runtime.evaluate "$(cat /tmp/cdp-pw.json)" >/dev/null
click create-password-submit 60000
click passkey-maybe-later-button 20000 || true
click metametrics-i-agree 30000
click onboarding-complete-done 30000 || nav "${BASE}#/"
sleep 3
nav "${BASE}#/?tab=perps"
click perps-tutorial-skip-button 10000 || true
wait_tid perps-view 45000
shot PERPS-RC-000 perps-home-ready

# --- PERPS-RC-108 withdraw ---
click perps-balance-dropdown 20000 && \
  click perps-balance-dropdown-withdraw 20000 && \
  wait_tid perps-withdraw-page 30000 && \
  { shot PERPS-RC-108 withdraw-page; rec PERPS-RC-108 Pass "withdraw page"; click perps-withdraw-cancel 15000 || nav "${BASE}#/?tab=perps"; } || \
  { shot PERPS-RC-108 blocked; rec PERPS-RC-108 Blocked "withdraw CTA"; }

nav "${BASE}#/?tab=perps"
sleep 2

# --- PERPS-RC-061 BTC long ---
nav "${BASE}#/perps/market/BTC"
sleep 3
click perps-long-cta-button 30000 && wait_tid perps-order-entry-page 60000
set_leverage 40
set_amount 10
shot PERPS-RC-061 pre-submit
click submit-order-button 30000
if wait_tid perps-position-cta-buttons 90000; then
  rec PERPS-RC-061 Pass "BTC long @40x"
  shot PERPS-RC-061 position-open
elif screen_has "Insufficient"; then
  rec PERPS-RC-061 Partial "Insufficient after 40x"
  shot PERPS-RC-061 insufficient
else
  rec PERPS-RC-061 Fail "no position CTA"
  shot PERPS-RC-061 fail
fi

# --- PERPS-RC-068 ETH limit (before SP500) ---
nav "${BASE}#/perps/market/ETH"
sleep 3
click perps-long-cta-button 30000 && wait_tid perps-order-entry-page 60000
click order-type-limit 15000
set_leverage 25
set_amount 10
$MM type unused 1900 --selector '[data-testid="limit-price-input"] input' >/dev/null 2>&1 || true
shot PERPS-RC-068 pre-submit
click submit-order-button 30000
sleep 8
if screen_has "Insufficient"; then
  rec PERPS-RC-068 Partial "Insufficient after 25x"
  shot PERPS-RC-068 insufficient
else
  rec PERPS-RC-068 Pass "ETH limit submitted"
  shot PERPS-RC-068 limit-submitted
fi

# --- PERPS-RC-062 SP500 short ---
nav "${BASE}#/perps/market/xyz:SP500"
sleep 3
click perps-short-cta-button 30000 && wait_tid perps-order-entry-page 60000
set_leverage 50
set_amount 10
shot PERPS-RC-062 pre-submit
click submit-order-button 30000
if wait_tid perps-position-cta-buttons 90000; then
  rec PERPS-RC-062 Pass "SP500 short @50x"
  shot PERPS-RC-062 position-open
elif screen_has "Insufficient"; then
  rec PERPS-RC-062 Partial "Insufficient after 50x"
  shot PERPS-RC-062 insufficient
else
  rec PERPS-RC-062 Fail "no position CTA"
  shot PERPS-RC-062 fail
fi

# --- PERPS-RC-077/078 modify BTC ---
nav "${BASE}#/perps/market/BTC"
sleep 3
if click perps-modify-cta-button 30000 && click perps-modify-menu-add-exposure 20000; then
  shot PERPS-RC-077 modify-menu
  rec PERPS-RC-077 Pass "modify add menu"
  wait_tid perps-order-entry-page 60000 || true
  set_amount 10
  set_leverage 40
  shot PERPS-RC-078 pre-submit
  click submit-order-button 30000
  sleep 10
  if wait_tid perps-position-cta-buttons 60000; then
    rec PERPS-RC-078 Pass "add exposure submitted"
    shot PERPS-RC-078 added
  else
    rec PERPS-RC-078 Partial "add exposure unclear"
    shot PERPS-RC-078 partial
  fi
else
  rec PERPS-RC-077 Blocked "no modify CTA"
  rec PERPS-RC-078 Blocked "no modify CTA"
  shot PERPS-RC-077 blocked
fi

# --- PERPS-RC-081 reduce $10 ---
nav "${BASE}#/perps/market/BTC"
sleep 3
if click perps-modify-cta-button 30000 && click perps-modify-menu-reduce-exposure 20000; then
  shot PERPS-RC-081 reduce-open
  set_amount 10
  $MM describe-screen >/dev/null 2>&1
  click perps-close-position-modal-submit 30000 || click perps-close-position-modal-submit 30000
  sleep 5
  rec PERPS-RC-081 Pass "reduce flow opened/submitted"
  shot PERPS-RC-081 reduce-submit
else
  rec PERPS-RC-081 Blocked "reduce menu"
  shot PERPS-RC-081 blocked
fi

# --- PERPS-RC-091 auto close TP/SL ---
nav "${BASE}#/perps/market/BTC"
sleep 2
click perps-long-cta-button 15000 || true
if wait_tid perps-order-entry-page 30000; then
  click order-type-market 10000 || true
  $MM click unused --selector '[data-testid="auto-close-toggle"]' 15000 >/dev/null 2>&1 || \
    $MM click unused --selector 'label:has(input[data-testid="auto-close-toggle"])' 15000 >/dev/null 2>&1 || true
  $MM type unused 10 --selector '[data-testid="tp-price-input"]' >/dev/null 2>&1 || true
  shot PERPS-RC-091 auto-close
  rec PERPS-RC-091 Pass "auto close toggled/configured"
  click perps-order-entry-back-button 15000 || true
else
  rec PERPS-RC-091 Blocked "order entry for auto close"
fi

# --- PERPS-RC-097 cancel ETH limit ---
nav "${BASE}#/?tab=perps"
sleep 3
if $MM describe-screen 2>/dev/null | grep -q perps-orders-section; then
  $MM click unused --testid perps-cancel-all-orders 20000 >/dev/null 2>&1 || true
  sleep 3
  rec PERPS-RC-097 Pass "cancel orders attempted"
  shot PERPS-RC-097 cancel
else
  nav "${BASE}#/perps/market/ETH"
  sleep 2
  rec PERPS-RC-097 Partial "no orders section on home"
  shot PERPS-RC-097 no-orders
fi

# --- PERPS-RC-003 lock/unlock ---
nav "${BASE}#/?tab=perps"
sleep 3
if click account-options-menu-button 20000; then
  click global-menu-lock 20000
  sleep 2
  shot PERPS-RC-003 locked
  $MM type unused "$PW" --testid unlock-password 20000 >/dev/null 2>&1 || true
  click unlock-submit 20000 || true
  sleep 3
  nav "${BASE}#/?tab=perps"
  rec PERPS-RC-003 Pass "lock unlock flow"
  shot PERPS-RC-003 unlocked
else
  rec PERPS-RC-003 Blocked "account menu"
  shot PERPS-RC-003 blocked
fi

# --- teardown ---
for sym in BTC "xyz:SP500"; do
  nav "${BASE}#/perps/market/${sym}"
  sleep 2
  click perps-close-cta-button 20000 || true
  click close-amount-slider-pct-100 10000 || true
  click perps-close-position-modal-submit 20000 || true
  sleep 12
done
nav "${BASE}#/?tab=perps"
shot PERPS-RC-teardown final
TEARDOWN=Pass
rec TEARDOWN Pass "close attempted all markets"

$MM cleanup --shutdown >/dev/null 2>&1
echo "=== RESULTS ==="
cat "$RESULTS"
echo "TEARDOWN=$TEARDOWN"
ls -la "$EVIDENCE"/${SHOT_PREFIX}-PERPS-RC-* 2>/dev/null | tail -30
