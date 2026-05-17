#!/bin/zsh
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

if [[ ! -f "$PROJECT_ROOT/.venv/bin/activate" ]]; then
  echo "Missing virtual environment at $PROJECT_ROOT/.venv"
  echo "Create it with: python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
  exit 1
fi

source "$PROJECT_ROOT/.venv/bin/activate"

if [[ -f "$HOME/.cargo/env" ]]; then
  source "$HOME/.cargo/env"
fi

export CC=/usr/bin/cc
export CXX=/usr/bin/c++
export CPP=/usr/bin/cc
export CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
export CARGO_HTTP_TIMEOUT=120
export CARGO_HTTP_LOW_SPEED_LIMIT=1
export CARGO_NET_RETRY=5

if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 7890 >/dev/null 2>&1; then
  export HTTP_PROXY="http://127.0.0.1:7890"
  export HTTPS_PROXY="http://127.0.0.1:7890"
  export ALL_PROXY="socks5://127.0.0.1:7890"
fi

cd "$PROJECT_ROOT/apps/desktop"
npm run tauri:dev
