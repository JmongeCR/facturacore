#!/usr/bin/env bash
# Genera los PDF de legal/pdf/ a partir de las fuentes de legal-src/ (no se publican en el sitio).
# Ejecutar después de cambiar el texto de cualquier documento legal: ./scripts/build-pdfs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT="${PORT:-8791}"

python3 -m http.server "$PORT" --directory "$ROOT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

build() {
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 \
    --print-to-pdf="$ROOT/legal/pdf/$2.pdf" \
    "http://127.0.0.1:$PORT/legal-src/$1.html" >/dev/null 2>&1
  echo "legal/pdf/$2.pdf"
}

mkdir -p "$ROOT/legal/pdf"
build privacidad politica-de-privacidad
build terminos   terminos-y-condiciones
build pagos      politica-de-pagos
