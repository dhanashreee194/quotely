# Quotely

Offline Electron quotation app (React + TypeScript + SQLite).

## Prerequisites

Quotely runs as a **desktop Electron app**. You do **not** install Electron globally — it comes from this repo’s dependencies.

| Requirement | Notes |
| --- | --- |
| **Node.js** | **20.x or newer** (22.x recommended). Needed to install deps and run scripts. |
| **npm** | Comes with Node. Used for install / build. |
| **Electron** | **`^39.2.6`** (currently resolves to 39.x). Installed via `npm install` into `node_modules/electron`. |
| **Native build tools** | Required so `better-sqlite3` can compile against Electron’s Node ABI. On macOS: Xcode Command Line Tools. On Windows: Visual Studio Build Tools (Desktop development with C++). On Linux: `build-essential` / Python as needed by `node-gyp`. |

Related Electron tooling (also installed by `npm install`):

- **electron-vite** — dev server and production build for main / preload / renderer
- **electron-builder** — packaging (Windows NSIS, macOS, Linux); `postinstall` runs `electron-builder install-app-deps` to rebuild native modules for Electron

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
npm install
```

This installs Electron 39.x and rebuilds native modules (`better-sqlite3`) for the Electron runtime.

### Development

```bash
npm run dev
```

Starts the Electron app with hot reload (electron-vite).

If Electron fails to launch and you see Node-related errors, ensure `ELECTRON_RUN_AS_NODE` is **not** set in your shell (`unset ELECTRON_RUN_AS_NODE`).

### Tests

```bash
npm test          # Vitest unit tests
npm run test:e2e  # Playwright against the built app
```

### Build / package

```bash
# Windows installer (QuotelySetup-<version>.exe) — prefer Windows or CI for signing
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```
