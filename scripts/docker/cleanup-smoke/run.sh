#!/usr/bin/env bash
set -euo pipefail

cd /repo

export SECURECLAW_STATE_DIR="/tmp/secureclaw-test"
export SECURECLAW_CONFIG_PATH="${SECURECLAW_STATE_DIR}/secureclaw.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${SECURECLAW_STATE_DIR}/credentials"
mkdir -p "${SECURECLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${SECURECLAW_CONFIG_PATH}"
echo 'creds' >"${SECURECLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${SECURECLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm secureclaw reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${SECURECLAW_CONFIG_PATH}"
test ! -d "${SECURECLAW_STATE_DIR}/credentials"
test ! -d "${SECURECLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${SECURECLAW_STATE_DIR}/credentials"
echo '{}' >"${SECURECLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm secureclaw uninstall --state --yes --non-interactive

test ! -d "${SECURECLAW_STATE_DIR}"

echo "OK"
