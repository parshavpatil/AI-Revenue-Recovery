#!/usr/bin/env bash
set -e

echo "Checking RecoverAI Voice foundation..."

command -v node >/dev/null 2>&1 || {
  echo "Node.js is not installed."
  exit 1
}

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm is not installed."
  exit 1
}

echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Foundation checks passed."
