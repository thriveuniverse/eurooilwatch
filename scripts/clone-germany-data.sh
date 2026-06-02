#!/usr/bin/env bash
# Populate TANKERKOENIG_DATA_DIR with JUST the current + previous month of the
# tankerkoenig-data repo, using a sparse + shallow + partial (blobless) clone.
# The full repo is ~20 GB of history; this pulls only a few MB.
#
# Auth: the repo requires a registered+verified tankerkoenig account that has
# accepted the ToS. Provide the clone URL (with whatever credentials your
# account uses — typically a PAT as the password) via TANKERKOENIG_DATA_REPO.
# Locally you can also rely on a cached git credential / SSH.
#
# Usage:
#   TANKERKOENIG_DATA_REPO='https://<user>:<token>@dev.azure.com/tankerkoenig/tankerkoenig-data/_git/tankerkoenig-data' \
#   TANKERKOENIG_DATA_DIR=.cache/tankerkoenig-data \
#   bash scripts/clone-germany-data.sh
set -euo pipefail

REPO="${TANKERKOENIG_DATA_REPO:-https://tankerkoenig@dev.azure.com/tankerkoenig/tankerkoenig-data/_git/tankerkoenig-data}"
DIR="${TANKERKOENIG_DATA_DIR:-.cache/tankerkoenig-data}"

Y=$(date -u +%Y);  M=$(date -u +%m)
PY=$(date -u -d '1 month ago' +%Y 2>/dev/null || date -u -v-1m +%Y)
PM=$(date -u -d '1 month ago' +%m 2>/dev/null || date -u -v-1m +%m)

PATHS=("stations/$Y/$M" "prices/$Y/$M")
if [ "$PY/$PM" != "$Y/$M" ]; then
  PATHS+=("stations/$PY/$PM" "prices/$PY/$PM")
fi

if [ ! -d "$DIR/.git" ]; then
  echo "[clone] fresh sparse/shallow/blobless clone into $DIR"
  git clone --no-checkout --depth 1 --filter=blob:none "$REPO" "$DIR"
  git -C "$DIR" sparse-checkout init --cone
else
  echo "[clone] refreshing existing clone in $DIR"
  git -C "$DIR" fetch --depth 1 origin
  git -C "$DIR" reset --hard "@{upstream}"
fi

echo "[clone] sparse-checkout: ${PATHS[*]}"
git -C "$DIR" sparse-checkout set "${PATHS[@]}"
git -C "$DIR" checkout

echo "[clone] done. Newest files:"
find "$DIR/stations" "$DIR/prices" -name '*.csv' 2>/dev/null | sort | tail -4
