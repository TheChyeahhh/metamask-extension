#!/usr/bin/env bash
# Retry missed Perps RC cases — meaningful screenshot names via mm screenshot --name.
# See docs/tests/headless-mm-session-prompt-perps-rc.md
set -uo pipefail
unset PREFIX
export SHOT_PREFIX="${SHOT_PREFIX:-perps-rc-13.34.0-2026-05-29}"
export EVIDENCE="${EVIDENCE:-/workspace/docs/tests/perps-rc-evidence-2026-05-29}"
mkdir -p "$EVIDENCE"
if [[ -x /tmp/run-perps-missed.sh ]]; then
  exec /tmp/run-perps-missed.sh "$@"
fi
echo "Missing /tmp/run-perps-missed.sh — copy from last automation session or re-run agent."
exit 1
