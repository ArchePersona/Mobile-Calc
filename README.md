# Mobile Calculator App (PWA & Native Hybrid)

A responsive, touch-optimized, mobile-first Calculator application engineered with TypeScript, CSS custom properties for dynamic theming (Dark/Light/System), native haptic feedback support via Web Vibration API, offline PWA capabilities with Service Worker caching, and automated build pipelines for Web, Android APK, and iOS IPA bundles.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Server](#development-server)
4. [Testing](#testing)
5. [Build & Packaging Workflows](#build--packaging-workflows)
   - [Web Build](#web-build)
   - [Android APK Build](#android-apk-build)
   - [iOS IPA Build](#ios-ipa-build)
6. [Repository Structure](#repository-structure)
7. [Future Expansion Roadmap](#future-expansion-roadmap)

---

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**: Latest release

### Platform-Specific Mobile Build Prerequisites

- **Android APK Compilation (Native)**:
  - Java Development Kit (JDK 17 or higher)
  - Android SDK (Build Tools 33+, Platform SDK 33+)
  - Android NDK & Gradle
- **iOS IPA Compilation (Native)**:
  - macOS (Monterey, Ventura, or Sonoma)
  - Xcode 14+ with Command Line Tools (`xcode-select --install`)
  - Active Apple Developer provisioning profile (for code-signed device builds)

---

## Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/example/mobile-calculator.git
cd mobile-calculator
npm install
```

---

## Development Server

To run the local development server with live reload and module resolution:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port displayed in your terminal). To test mobile viewport, open Chrome DevTools / Safari Web Inspector and toggle Device Mode.

---

## Testing

Execute the unit and integration test suite:

```bash
# Run all unit tests with Vitest / Jest
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage report
npm run test:coverage
```

Tests validate:
- Arithmetic precision, sequential calculations, division by zero, operator precedence, and floating-point handling in `src/core/calculator.ts`.
- Theme persistence, system query listeners, and DOM theme attribute mutation in `src/ui/theme.ts`.
- Haptic pattern resolution, fallback behavior, and vibration triggering in `src/ui/haptics.ts`.

---

## Build & Packaging Workflows

### Web Build

Compiles TypeScript, minifies stylesheets, copies assets, and prepares the production PWA bundle inside `dist/`:

```bash
npm run build
```

To preview the built production site locally:

```bash
npm run preview
```

### Android APK Build

To package web assets and execute the automated Android build pipeline:

```bash
# Using npm script
npm run build:android

# Or directly using the shell script
./scripts/build-android.sh
```

**Output Location:** `dist/android/` (contains standalone hybrid assets or `calculator-release.apk` / `calculator-release-unsigned.apk` if Android SDK environment is configured).

### iOS IPA Build

To package web assets and execute the iOS archive & export pipeline:

```bash
# Using npm script
npm run build:ios

# Or directly using the shell script
./scripts/build-ios.sh
```

**Output Location:** `dist/ios/` (contains standalone hybrid bundle or Xcode xcarchive / IPA bundle on macOS).

---

## Repository Structure

```
├── dist/                       # Production output and compiled distribution
│   ├── assets/                 # Compiled JavaScript and CSS bundles
│   │   ├── calculator.js
│   │   └── theme.css
│   ├── index.html              # Built HTML entry point
│   ├── manifest.json           # PWA Web App Manifest
│   └── sw.js                   # Service Worker for offline asset caching
├── public/                     # Static files copied verbatim into dist/
│   ├── manifest.json
│   └── sw.js
├── scripts/                    # Automation and packaging scripts
│   ├── build-android.sh        # Android APK packaging workflow
│   └── build-ios.sh            # iOS IPA packaging workflow
├── src/                        # Application source code
│   ├── core/                   # Core business logic and pure calculation engine
│   │   ├── calculator.ts       # Mathematical operations and state transitions
│   │   └── types.ts            # Type definitions and interfaces
│   ├── ui/                     # Presentation, interaction, and styling logic
│   │   ├── haptics.ts          # Touch haptics and vibration triggers
│   │   └── theme.ts            # Theme management (Dark/Light/System)
│   ├── main.ts                 # App entry: wires the engine to the DOM
│   └── theme.css               # Application styles
├── tests/                      # Automated test suites
│   ├── core/
│   │   └── calculator.test.ts  # Core calculation engine unit tests
│   └── ui/
│       ├── haptics.test.ts     # Haptic feedback unit tests
│       └── theme.test.ts       # Theme manager unit tests
├── index.html                  # Source HTML entry point
├── vite.config.ts              # Vite build configuration
├── vitest.config.ts            # Vitest configuration (jsdom environment)
├── package.json                # Project dependencies and script declarations
├── tsconfig.json               # TypeScript compiler configuration
└── README.md                   # Project documentation and roadmap
```

---

## Future Expansion Roadmap

The following milestones outline scheduled enhancements for upcoming major and minor releases:

### 1. Scientific Functions Engine
- **Trigonometric Functions**: Implement `sin`, `cos`, `tan`, `asin`, `acos`, `atan` with Radian/Degree toggle switch.
- **Logarithms & Powers**: Add natural logarithm (`ln`), base-10 logarithm (`log10`), exponential (`e^x`, `10^x`), power (`x^y`), and root operations (`√x`, `³√x`).
- **Constants & Parens**: Support `π`, `e`, Euler-Mascheroni constant, and balanced parentheses `(` `)` for compound algebraic evaluation.

### 2. Memory Storage (M+, M-, MR, MC, MS)
- **State Retention**: Dedicated memory register persisting through `localStorage`.
- **Interactive Visual Indicator**: Dedicated badge display (`M`) when memory value is non-zero.
- **Memory Actions**:
  - `M+`: Add current display value to memory register.
  - `M-`: Subtract current display value from memory register.
  - `MR`: Recall value from memory to current display.
  - `MC`: Clear memory register back to zero.
  - `MS`: Store current display directly to memory.

### 3. Calculation History & Audit Trail
- **History Drawer**: Slide-over drawer displaying past calculations with timestamp, formula expression, and result.
- **Recall & Reuse**: Tap any historical entry to inject formula or result back into active calculation register.
- **Persistence & Export**: IndexedDB storage with CSV / JSON export and clear history options.

### 4. Customizable Themes & Accent Palettes
- **Preset Color Schemes**: Add OLED Pure Black, High Contrast Accessibility, Solarized Dark/Light, Cyberpunk Neon, and Nordic Frost.
- **User Accent Customizer**: Color picker allowing users to customize primary action button hues, display glows, and highlight accents.
- **Dynamic System Contrast Detection**: Automatically switch to high-contrast mode when OS accessibility settings request `prefers-contrast: more`.
