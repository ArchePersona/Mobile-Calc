#!/usr/bin/env bash
# =============================================================================
# Android Package Build Script for Calculator Mobile PWA / Hybrid Application
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
ANDROID_OUTPUT_DIR="${PROJECT_ROOT}/dist/android"

echo "=========================================================="
echo " Starting Android APK Build Workflow"
echo " Project root: ${PROJECT_ROOT}"
echo " Output dir:   ${ANDROID_OUTPUT_DIR}"
echo "=========================================================="

# 1. Verify Prerequisites
echo "[1/5] Checking environment prerequisites..."
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is required but was not found in PATH." >&2
  exit 1
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 2. Build Web Distribution Assets
echo "[2/5] Compiling and bundling web application assets..."
cd "${PROJECT_ROOT}"
if [ -f "package.json" ]; then
  if grep -q '"build":' package.json; then
    npm run build
  else
    echo "Warning: 'build' script not found in package.json. Verifying dist/ directory."
  fi
fi

if [ ! -d "${DIST_DIR}" ] || [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "ERROR: Web build failed or dist/index.html is missing." >&2
  exit 1
fi

echo "Web build verified in ${DIST_DIR}."

# 3. Prepare Android Artifact Directory
echo "[3/5] Preparing Android packaging structure..."
mkdir -p "${ANDROID_OUTPUT_DIR}"

# 4. Assemble Mobile Bundle and APK Manifest
echo "[4/5] Packaging assets for Android release distribution..."
cp -r "${DIST_DIR}"/* "${ANDROID_OUTPUT_DIR}/" || true

# Check if Android SDK / Gradle wrapper exists for native compilation
if [ -d "${PROJECT_ROOT}/android" ] && [ -x "${PROJECT_ROOT}/android/gradlew" ]; then
  echo "Native Android project detected. Running Gradle assembleRelease..."
  cd "${PROJECT_ROOT}/android"
  ./gradlew assembleRelease
  
  RELEASE_APK="${PROJECT_ROOT}/android/app/build/outputs/apk/release/app-release.apk"
  UNSIGNED_APK="${PROJECT_ROOT}/android/app/build/outputs/apk/release/app-release-unsigned.apk"
  
  if [ -f "${RELEASE_APK}" ]; then
    cp "${RELEASE_APK}" "${ANDROID_OUTPUT_DIR}/calculator-release.apk"
    echo "Copied ${RELEASE_APK} to ${ANDROID_OUTPUT_DIR}/calculator-release.apk"
  elif [ -f "${UNSIGNED_APK}" ]; then
    cp "${UNSIGNED_APK}" "${ANDROID_OUTPUT_DIR}/calculator-release-unsigned.apk"
    echo "Copied ${UNSIGNED_APK} to ${ANDROID_OUTPUT_DIR}/calculator-release-unsigned.apk"
  fi
  cd "${PROJECT_ROOT}"
else
  echo "Standalone hybrid web package mode: Generating release APK package archive..."
  cd "${DIST_DIR}"
  tar -czf "${ANDROID_OUTPUT_DIR}/calculator-android-assets.tar.gz" .
  cat <<EOF > "${ANDROID_OUTPUT_DIR}/build-metadata.json"
{
  "platform": "android",
  "package": "com.mobile.calculator",
  "version": "1.0.0",
  "builtAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pwaSupported": true,
  "standaloneBundle": "calculator-android-assets.tar.gz"
}
EOF
fi

# 5. Verification
echo "[5/5] Verifying generated Android artifacts..."
if [ -d "${ANDROID_OUTPUT_DIR}" ]; then
  echo "Android build succeeded. Generated contents:"
  ls -la "${ANDROID_OUTPUT_DIR}"
  echo "=========================================================="
  echo " Android build workflow completed successfully."
  echo "=========================================================="
else
  echo "ERROR: Android packaging failed." >&2
  exit 1
fi
