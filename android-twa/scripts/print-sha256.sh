#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .keystore.env ]]; then
  # shellcheck disable=SC1091
  source .keystore.env
fi

KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-OsoSound2026!}"

if [[ ! -f android.keystore ]]; then
  echo "No existe android.keystore. Ejecutá: npm run keystore"
  exit 1
fi

echo "=== SHA-256 del keystore local (upload key) ==="
keytool -list -v -keystore android.keystore -alias ososound -storepass "$KEYSTORE_PASSWORD" | grep -A1 "SHA256:"

cat <<'EOF'

IMPORTANTE para assetlinks.json:
- Después de subir el AAB a Play Console, usá el SHA-256 de
  "Firma de aplicaciones" (App signing), NO necesariamente el de arriba.
- Play Console → Configuración → Integridad de la app → Firma de aplicaciones
EOF
