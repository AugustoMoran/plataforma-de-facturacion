#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .keystore.env ]]; then
  # shellcheck disable=SC1091
  source .keystore.env
fi

KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-OsoSound2026!}"
KEY_PASSWORD="${KEY_PASSWORD:-$KEYSTORE_PASSWORD}"

if [[ -f android.keystore ]]; then
  echo "android.keystore ya existe. No se regeneró."
  exit 0
fi

keytool -genkeypair -v \
  -keystore android.keystore \
  -alias ososound \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "CN=Oso Sound, OU=Mobile, O=Oso Sound, L=Buenos Aires, ST=BA, C=AR"

echo "Keystore creado: android.keystore"
echo "Guardá la contraseña en .keystore.env"
