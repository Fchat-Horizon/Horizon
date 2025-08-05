# Horizon Electron Build System

This directory contains the Electron application for F-Chat Horizon and its comprehensive build system.

- [Horizon Electron Build System](#horizon-electron-build-system)
  - [Directory Structure](#directory-structure)
  - [Quick Start](#quick-start)
    - [Prerequisites](#prerequisites)
    - [Build Commands](#build-commands)
  - [Build Script Usage](#build-script-usage)
    - [Command Line Options](#command-line-options)
    - [Supported Formats by Platform](#supported-formats-by-platform)
    - [Supported Architectures by Platform](#supported-architectures-by-platform)
  - [Docker Builds](#docker-builds)
    - [Docker Requirements](#docker-requirements)
  - [Release Process](#release-process)
    - [Manual Releases](#manual-releases)
    - [Automated Releases (GitHub Actions)](#automated-releases-github-actions)
    - [Development Builds (PR Testing)](#development-builds-pr-testing)
  - [Configuration](#configuration)
    - [Main Configuration](#main-configuration)
    - [Docker Configuration](#docker-configuration)
  - [Development](#development)
    - [Local Development](#local-development)
    - [File Organization](#file-organization)
    - [Build Process Flow](#build-process-flow)
  - [Scripts Reference](#scripts-reference)
    - [NPM Scripts](#npm-scripts)
    - [Release Scripts](#release-scripts)
  - [Architecture Notes](#architecture-notes)
    - [Build Script Architecture](#build-script-architecture)
    - [Configuration Inheritance](#configuration-inheritance)
  - [Notes](#notes)

## Directory Structure

```
electron/
├── build/                     # Build scripts and configuration
│   ├── build.mjs              # Main build script
│   ├── docker-config.mjs      # Docker configuration for builds
│   ├── icon.ico               # Windows icon
│   ├── icon.icns              # macOS icon
│   ├── icon.png               # Linux icon
│   └── ...                    # Other build assets
├── release-scripts/           # Platform-specific release scripts
│   ├── linux.sh               # Linux release build
│   ├── linux-dev.sh           # Linux development build
│   ├── macos.sh               # macOS release build
│   ├── macos-dev.sh           # macOS development build
│   ├── windows.ps1            # Windows release build
│   └── windows-dev.ps1        # Windows development build
├── app/                       # Built application files
├── dist/                      # Distribution artifacts
├── package.json               # Electron build configuration
└── README.md                  # This file
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- Platform-specific dependencies (see CI workflows)

### Build Commands

```bash
# Development builds
pnpm run build:dev:linux    # Linux development build
pnpm run build:dev:mac      # macOS development build
pnpm run build:dev:win      # Windows development build

# Production builds
pnpm run build:linux        # Linux production build
pnpm run build:mac          # macOS production build
pnpm run build:win          # Windows production build
```

## Build Script Usage

The main build script is located at `build/build.mjs` and provides options:

```bash
# Basic usage
node build/build.mjs --os <platform>

# Examples
node build/build.mjs --os linux                           # Default: deb, x64
node build/build.mjs --os macos -f dmg zip               # Multiple formats
node build/build.mjs --os windows -a x64 ia32            # Multiple architectures
node build/build.mjs --os linux --docker                 # Force Docker build
node build/build.mjs --os macos --no-docker              # Disable Docker
```

### Command Line Options

| Option                      | Description                                                | Example        |
| --------------------------- | ---------------------------------------------------------- | -------------- |
| `--os <platform>`           | **Required.** Target platform: `linux`, `macos`, `windows` | `--os linux`   |
| `-f, --format <formats...>` | Output formats (see supported formats below)               | `-f deb rpm`   |
| `-a, --arch <arches...>`    | Target architectures                                       | `-a x64 arm64` |
| `-v, --version <version>`   | Override app version                                       | `-v 1.33.0`    |
| `--docker`                  | Force Docker builds (Linux/Windows only)                   | `--docker`     |
| `--no-docker`               | Disable Docker builds                                      | `--no-docker`  |

### Supported Formats by Platform

| Platform    | Formats                            |
| ----------- | ---------------------------------- |
| **Linux**   | `deb`, `rpm`, `tar.gz`, `AppImage` |
| **macOS**   | `dmg`, `zip`                       |
| **Windows** | `nsis`, `msi`, `exe`, `portable`   |

### Supported Architectures by Platform

| Platform    | Architectures                   |
| ----------- | ------------------------------- |
| **Linux**   | `x64`, `arm64`, `arm7l`, `ia32` |
| **macOS**   | `x64`, `arm64`, `universal`     |
| **Windows** | `x64`, `ia32`, `arm64`          |

## Docker Builds

Docker builds are automatically used when available, except:

- **macOS**: Docker builds are disabled (not supported)
- **GitHub Actions**: Native builds are preferred for faster execution
- **Manual override**: Use `--docker` or `--no-docker` flags

### Docker Requirements

- Docker Desktop or Docker Engine
- Internet connection for image downloads
- Sufficient disk space for build containers

Docker images used:

- **Linux**: `electronuserland/builder`
- **Windows**: `electronuserland/builder:wine`

## Release Process

### Manual Releases

Use the platform-specific release scripts:

```bash
# Linux
./release-scripts/linux.sh 1.33.0

# macOS
./release-scripts/macos.sh 1.33.0

# Windows (PowerShell)
.\release-scripts\windows.ps1 -ReleaseVersion "1.33.0"
```

### Automated Releases (GitHub Actions)

1. **Create a tag**: `git tag v1.33.0 && git push origin v1.33.0`
2. **GitHub Actions will**:
   - Build for all platforms
   - Generate SHA256 checksums
   - Create a draft release with artifacts

### Development Builds (PR Testing)

Pull requests automatically trigger builds using the `-dev` scripts:

- `linux-dev.sh`
- `macos-dev.sh`
- `windows-dev.ps1`

## Configuration

### Main Configuration

Build configuration is centralized in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "net.flist.fchat",
    "productName": "Horizon",
    "artifactName": "F-Chat.${productName}-${os}-${arch}.${ext}",
    "directories": {
      "app": "app",
      "output": "dist"
    }
    // ... platform-specific configurations
  }
}
```

### Docker Configuration

Docker-specific settings are in `build/docker-config.mjs`:

- Environment variable handling
- Volume mapping
- Platform-specific container setup

## Development

### Local Development

```bash
# Install dependencies
pnpm install

# Build webpack assets
pnpm run webpack:dev    # Development build
pnpm run webpack:prod   # Production build

# Start Electron
pnpm start

# Debug modes
pnpm run startDebugMain    # Debug main process
pnpm run startDebugRender  # Debug renderer process
```

### File Organization

- **Source code**: Located in parent directories (`../chat/`, `../components/`, etc.) as well as some in the root directories
- **Build assets**: `build/` directory (icons, configuration)
- **Output**: `dist/` directory (final distributables)
- **Temporary**: `app/` directory (built application, auto-generated)

### Build Process Flow

1. **Webpack**: Bundles source code → `app/` directory
2. **Electron Builder**: Packages `app/` → `dist/` directory
3. **Release Scripts**: Copy `dist/` artifacts → release directories (if run from a release script)

## Scripts Reference

### NPM Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `webpack:dev`     | Build webpack bundle (development)   |
| `webpack:prod`    | Build webpack bundle (production)    |
| `build`           | Alias for `webpack:dev`              |
| `build:dist`      | Alias for `webpack:prod`             |
| `watch`           | Watch mode for webpack               |
| `start`           | Start Electron application           |
| `build:linux`     | Build Linux packages (production)    |
| `build:mac`       | Build macOS packages (production)    |
| `build:win`       | Build Windows packages (production)  |
| `build:dev:linux` | Build Linux packages (development)   |
| `build:dev:mac`   | Build macOS packages (development)   |
| `build:dev:win`   | Build Windows packages (development) |

### Release Scripts

All release scripts accept:

- **Required**: Release version (e.g., `1.33.0`)
- **Optional**: Output path (defaults to `release_artifacts`)

## Architecture Notes

### Build Script Architecture

The build system is designed with separation of concerns:

1. **`build.mjs`**: Core build logic, CLI interface
2. **`docker-config.mjs`**: Docker-specific functionality
3. **`package.json`**: Electron Builder configuration
4. **Release scripts**: Platform-specific packaging and deployment

### Configuration Inheritance

1. **Base config**: `package.json` `build` section
2. **Script overrides**: `build.mjs` only modifies targets
3. **Platform specifics**: Handled by Electron Builder automatically

This ensures consistency while allowing flexibility for different build scenarios.

---

## Notes

- **Product Name**: Must remain "Horizon" for compatibility
- **App ID**: `net.flist.fchat` (legacy, maintained for user data continuity)
- **Output**: All builds go to `dist/` directory
- **Icons**: Platform-specific icons in `build/` directory

For more information, see the main [project documentation](../CONTRIBUTING.md) or the GitHub Actions workflows in `.github/workflows/`.
