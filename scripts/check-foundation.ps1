$ErrorActionPreference = "Stop"

Write-Host "Checking RecoverAI Voice foundation..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw "pnpm is not installed."
}

Write-Host "Node: $(node --version)"
Write-Host "pnpm: $(pnpm --version)"
Write-Host "Foundation checks passed."
