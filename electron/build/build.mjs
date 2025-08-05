/**
 * NOTE: Hey! Welcome to Rose's build script for the Horizon Project.
 *
 *       While a mess, it's actually quite simple in practice.
 *       In short, this script allows you to build the Horizon Electron app
 *       for different operating systems and architectures, with or without Docker.
 *       It uses electron-builder under the hood to handle the actual building process.
 *
 *       Usage:
 *         node build.mjs --os <macos|linux|windows> [options]
 *
 *       Options:
 *         --format <formats...>  Specify output formats (e.g., dmg, zip, deb, exe)
 *         --arch <arches...>     Specify target architectures (e.g., x64, arm64)
 *         --version <version>    Set app version
 *         --docker               Force Docker builds
 *         --no-docker            Disable Docker builds
 */

import { program } from 'commander';
import { arch as systemArch } from 'os';
import { build } from 'electron-builder';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  isDockerAvailable,
  shouldUseDocker,
  runDockerBuild
} from './docker-config.mjs';

// & Pretty colors for terminal output because we're fancy
const COLORS = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m'
};

// * Configuration for each OS with their supported formats and architectures
const OS_CONFIGS = {
  macos: {
    aliases: ['mac'],
    formats: ['dmg', 'zip'],
    arches: ['x64', 'arm64', 'universal']
  },
  linux: {
    aliases: ['unix', 'linux64', 'linux32'],
    formats: ['deb', 'rpm', 'tar.gz', 'AppImage'],
    arches: ['x64', 'arm64', 'armv7l', 'ia32']
  },
  windows: {
    aliases: ['win', 'win32', 'win64'],
    formats: ['exe', 'msi', 'nsis', 'portable'],
    arches: ['x64', 'ia32', 'arm64']
  }
};

// $ Sets up the commander program with all the fancy CLI options
function setupProgram() {
  return program
    .name('build.mjs')
    .description('Build script for the Horizon Electron application')
    .requiredOption('--os <os>', 'Target OS (macos, linux, windows)')
    .option('-f, --format <formats...>', 'Output formats')
    .option('-a, --arch <arches...>', 'Target architectures')
    .option('-v, --version <version>', 'App version')
    .option('--docker', 'Force Docker builds')
    .option('--no-docker', 'Disable Docker builds')
    .addHelpText(
      'after',
      `
Examples:
  node build/build.mjs --os linux                    # Build for Linux (default format: deb, arch: x64)
  node build/build.mjs --os macos -f dmg zip         # Build for macOS with dmg and zip formats
  node build/build.mjs --os windows -a x64 ia32      # Build for Windows with x64 and ia32 architectures
  node build/build.mjs --os linux --docker           # Force Docker build for Linux
  node build/build.mjs --os macos --no-docker        # Disable Docker for macOS (already disabled by default)

Supported formats by OS:
  macOS:   dmg, zip
  Linux:   deb, rpm, tar.gz, AppImage
  Windows: exe, msi, nsis, portable

Supported architectures by OS:
  macOS:   x64, arm64, universal
  Linux:   x64, arm64, arm7l, ia32
  Windows: x64, ia32, arm64
`
    )
    .configureOutput({
      outputError: (str, write) => {
        // * Custom error handling because the default commander errors are ugly
        if (str.includes("required option '--os <os>' not specified")) {
          write(
            `${COLORS.red}Error: Missing required option --os${COLORS.reset}\n`
          );
          write(
            `${COLORS.yellow}Usage: node build/build.mjs --os <macos|linux|windows> [options]${COLORS.reset}\n`
          );
          write(
            `${COLORS.cyan}Run 'node build/build.mjs --help' for detailed usage information.${COLORS.reset}\n`
          );
        } else {
          write(str);
        }
      }
    });
}
// $ Finds the target OS
function findTargetOS(osInput) {
  return Object.keys(OS_CONFIGS).find(
    key =>
      key === osInput.toLowerCase() ||
      OS_CONFIGS[key].aliases.includes(osInput.toLowerCase())
  );
}
// $ If options are not provided, set defaults
function setDefaults(opts, config) {
  const { formats: defaultFormats, arches: defaultArches } = config;

  opts.format = opts.format?.length ? opts.format : [defaultFormats[0]];
  opts.arch = opts.arch?.length
    ? opts.arch
    : [defaultArches.includes(systemArch()) ? systemArch() : defaultArches[0]];
}

// $ Now, we validate those suckers
function validateOptions(opts, config, targetKey) {
  const { formats: validFormats, arches: validArches } = config;
  // * Filter out any invalid options the user might have passed
  const invalidFormats = opts.format.filter(f => !validFormats.includes(f));
  const invalidArches = opts.arch.filter(a => !validArches.includes(a));

  if (invalidFormats.length || invalidArches.length) {
    console.error(
      `${COLORS.red}Invalid options for ${targetKey}:${COLORS.reset}`
    );
    if (invalidFormats.length) {
      console.error(`  Formats: ${invalidFormats.join(', ')}`);
    }
    if (invalidArches.length) {
      console.error(`  Architectures: ${invalidArches.join(', ')}`);
    }
    process.exit(1);
  }
}

// $ Runs electron-builder directly on the host system (no Docker)
async function runNativeBuild(opts, targetKey) {
  console.log('Starting native build...');

  // * Read existing configuration from package.json
  const packageJsonPath = path.resolve('../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const baseConfig = packageJson.build || {};

  // * Map our internal OS keys to electron-builder's expected property names
  const platformMap = {
    linux: 'linux',
    macos: 'mac',
    windows: 'win'
  };

  // * Create target specifications
  const targets = opts.format.flatMap(format =>
    opts.arch.map(arch => ({
      target: format,
      arch: arch
    }))
  );

  // * Use package.json config as base, only override targets
  const config = {
    ...baseConfig,
    [platformMap[targetKey]]: { target: targets }
  };

  await build({ config });
  console.log('Build completed successfully!');
}

// $ Main execution - where the magic happens
(async () => {
  const opts = setupProgram().parse(process.argv).opts();

  const targetKey = findTargetOS(opts.os);
  if (!targetKey) {
    console.error(`${COLORS.red}Invalid OS: ${opts.os}${COLORS.reset}`);
    process.exit(1);
  }

  // * Set up defaults and validate everything
  const targetConfig = OS_CONFIGS[targetKey];
  setDefaults(opts, targetConfig);
  validateOptions(opts, targetConfig, targetKey);

  // * Show the user what we're about to do
  console.log(
    `${COLORS.cyan}Building for ${targetKey} | formats: ${opts.format.join(', ')} | arches: ${opts.arch.join(', ')}${COLORS.reset}`
  );

  // * Choose between Docker and native build
  if (shouldUseDocker(opts, targetKey, COLORS)) {
    runDockerBuild(opts, targetKey);
  } else {
    await runNativeBuild(opts, targetKey);
  }
})();
