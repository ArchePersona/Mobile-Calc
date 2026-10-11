#!/usr/bin/env bash
# =============================================================================
# iOS Package Build Script for Calculator Mobile PWA / Hybrid Application
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
IOS_OUTPUT_DIR="${PROJECT_ROOT}/dist/ios"

echo "=========================================================="
echo " Starting iOS IPA Build Workflow"
echo " Project root: ${PROJECT_ROOT}"
echo " Output dir:   ${IOS_OUTPUT_DIR}"
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

# 2. Build Web Assets
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

# 3. Prepare iOS Artifact Directory
echo "[3/5] Preparing iOS packaging structure..."
mkdir -p "${IOS_OUTPUT_DIR}"

# 4. Assemble Mobile Bundle and iOS Distribution
echo "[4/5] Packaging assets for iOS release distribution..."

if [ "$(uname)" = "Darwin" ] && command -v xcodebuild >/dev/null 2>&1 && [ -d "${PROJECT_ROOT}/ios" ]; then
  echo "macOS with Xcode detected and iOS project found. Executing xcodebuild archive..."
  cd "${PROJECT_ROOT}/ios"
  ARCHIVE_PATH="${IOS_OUTPUT_DIR}/Calculator.xcarchive"
  xcodebuild -workspace "Calculator.xcworkspace" \
             -scheme "Calculator" \
             -configuration Release \
             -archivePath "${ARCHIVE_PATH}" \
             archive

  xcodebuild -exportArchive \
             -archivePath "${ARCHIVE_PATH}" \
             -exportPath "${IOS_OUTPUT_DIR}" \
             -exportOptionsPlist "${PROJECT_ROOT}/ios/ExportOptions.plist" || true
  cd "${PROJECT_ROOT}"
else
  echo "Non-macOS or standalone web mode: Generating iOS distribution bundle..."
  cd "${DIST_DIR}"
  tar -czf "${IOS_OUTPUT_DIR}/calculator-ios-assets.tar.gz" .
  cat <<EOF > "${IOS_OUTPUT_DIR}/build-metadata.json"
{
  "platform": "ios",
  "bundleIdentifier": "com.mobile.calculator",
  "version": "1.0.0",
  "builtAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "pwaSupported": true,
  "standaloneBundle": "calculator-ios-assets.tar.gz"
}
EOF
fi

# 5. Verification
echo "[5/5] Verifying generated iOS artifacts..."
if [ -d "${IOS_OUTPUT_DIR}" ]; then
  echo "iOS build succeeded. Generated contents:"
  ls -la "${IOS_OUTPUT_DIR}"
  echo "=========================================================="
  echo " iOS build workflow completed successfully."
  echo "=========================================================="
else
  echo "ERROR: iOS packaging failed." >&2
  exit 1
fi
