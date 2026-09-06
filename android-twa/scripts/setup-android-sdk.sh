#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
TOOLS_ZIP="/tmp/android-cmdline-tools.zip"
TOOLS_DIR="$ANDROID_HOME/cmdline-tools/latest"

mkdir -p "$ANDROID_HOME"

if [[ ! -d "$TOOLS_DIR" ]]; then
  echo "Descargando Android command line tools..."
  curl -fsSL -o "$TOOLS_ZIP" https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  rm -rf /tmp/cmdline-tools
  unzip -q "$TOOLS_ZIP" -d /tmp
  mv /tmp/cmdline-tools "$TOOLS_DIR"
fi

export PATH="$TOOLS_DIR/bin:$ANDROID_HOME/platform-tools:$PATH"

yes | sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "cmdline-tools;latest"

echo ""
echo "Android SDK instalado en: $ANDROID_HOME"

# Bubblewrap requiere $ANDROID_HOME/bin o $ANDROID_HOME/tools
mkdir -p "$ANDROID_HOME/bin"
if [[ ! -e "$ANDROID_HOME/bin/sdkmanager" ]]; then
  ln -sfn ../cmdline-tools/latest/bin/sdkmanager "$ANDROID_HOME/bin/sdkmanager"
fi

echo "Agregá a tu shell:"
echo "  export ANDROID_HOME=$ANDROID_HOME"
echo "  export PATH=\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH"
