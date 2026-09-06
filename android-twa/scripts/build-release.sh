#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .keystore.env ]]; then
  # shellcheck disable=SC1091
  source .keystore.env
fi

export KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:-OsoSound2026!}"
export KEY_PASSWORD="${KEY_PASSWORD:-$KEYSTORE_PASSWORD}"
export BUBBLEWRAP_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD"
export BUBBLEWRAP_KEY_PASSWORD="$KEY_PASSWORD"

if [[ -z "${ANDROID_HOME:-}" ]]; then
  export ANDROID_HOME="$HOME/android-sdk"
fi

if [[ ! -f android.keystore ]]; then
  echo "Generando keystore..."
  bash ./scripts/generate-keystore.sh
fi

if [[ ! -d "$ANDROID_HOME/platforms" ]]; then
  echo "Android SDK no encontrado. Ejecutá: npm run setup"
  exit 1
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /usr/lib/jvm/java-17-openjdk-amd64 ]]; then
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  elif command -v java >/dev/null 2>&1; then
    export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
  fi
fi

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Bubblewrap valida que exista $ANDROID_HOME/bin (SDK moderno usa cmdline-tools)
if [[ ! -d "$ANDROID_HOME/bin" ]]; then
  mkdir -p "$ANDROID_HOME/bin"
  ln -sfn ../cmdline-tools/latest/bin/sdkmanager "$ANDROID_HOME/bin/sdkmanager"
fi

mkdir -p "$HOME/.bubblewrap"
cat > "$HOME/.bubblewrap/config.json" <<EOF
{"jdkPath":"$JAVA_HOME","androidSdkPath":"$ANDROID_HOME"}
EOF

echo "Actualizando proyecto TWA..."
npx bubblewrap update --skipVersionUpgrade

echo "Compilando y firmando AAB..."
npx bubblewrap build

OUTPUT_DIR="$ROOT_DIR/output"
mkdir -p "$OUTPUT_DIR"

FOUND_AAB="$(find "$ROOT_DIR" -maxdepth 1 -name 'app-release-bundle.aab' -type f | head -1)"
if [[ -z "$FOUND_AAB" ]]; then
  FOUND_AAB="$(find "$ROOT_DIR" -maxdepth 3 -name '*.aab' -type f | head -1)"
fi
if [[ -n "$FOUND_AAB" ]]; then
  cp "$FOUND_AAB" "$OUTPUT_DIR/ososound-release.aab"
  echo ""
  echo "✓ AAB listo: $OUTPUT_DIR/ososound-release.aab"
else
  echo "No se encontró el .aab generado. Revisá los logs de bubblewrap build."
  exit 1
fi
