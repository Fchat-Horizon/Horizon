/**
 * NOTE: Hey! Welcome to Rose's build script for the Horizon Project.
 */

import { program } from 'commander';
import { arch as systemArch } from 'os';
import { build } from 'electron-builder';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// & Pretty colors for terminal output because we're fancy like that
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
    arches: ['x64', 'arm64']
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
    .option('-o, --output <dir>', 'Output directory')
    .option('--docker', 'Force Docker builds')
    .option('--no-docker', 'Disable Docker builds')
    .addHelpText(
      'after',
      `
Examples:
  node build.mjs --os linux                    # Build for Linux (default format: deb, arch: x64)
  node build.mjs --os macos -f dmg zip         # Build for macOS with dmg and zip formats
  node build.mjs --os windows -a x64 ia32      # Build for Windows with x64 and ia32 architectures
  node build.mjs --os linux --docker           # Force Docker build for Linux
  node build.mjs --os macos --no-docker        # Disable Docker for macOS (already disabled by default)

Supported formats by OS:
  macOS:   dmg, zip
  Linux:   deb, rpm, tar.gz, AppImage
  Windows: exe, msi, nsis, portable

Supported architectures by OS:
  macOS:   x64, arm64, universal
  Linux:   x64, arm64
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
            `${COLORS.yellow}Usage: node build.mjs --os <macos|linux|windows> [options]${COLORS.reset}\n`
          );
          write(
            `${COLORS.cyan}Run 'node build.mjs --help' for detailed usage information.${COLORS.reset}\n`
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
// $ Yo, we got docker?
// * Tries to run 'docker info' to see if Docker is actually installed and running
function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
// $ Are we running in github actions?
function isRunningInGitHubActions() {
  return process.env.GITHUB_ACTIONS === 'true';
}

// $ Nice, nice, should we use it?
// * Determines whether to use Docker based on user preference and availability
function shouldUseDocker(opts, targetKey) {
  // * Never use Docker for macOS (doesn't work) or if explicitly disabled
  if (opts.docker === false || targetKey === 'macos') return false;

  // * Check if we're running in GitHub Actions
  if (isRunningInGitHubActions()) {
    console.log(
      `${COLORS.yellow}GitHub Actions detected - using native build instead of Docker${COLORS.reset}`
    );
    return false;
  }

  if (opts.docker) {
    if (!isDockerAvailable()) {
      console.error(
        `${COLORS.red}Docker requested but not available${COLORS.reset}`
      );
      process.exit(1);
    }
    return true;
  }

  return isDockerAvailable();
}

// $ If we're meant to, and have it available, run docker.
// * This function is a hot mess but it works, mostly
function runDockerBuild(opts, targetKey) {
  const image =
    targetKey === 'linux'
      ? 'electronuserland/builder'
      : 'electronuserland/builder:wine';
  const project = path.basename(process.cwd());

  const envVars = Object.keys(process.env)
    .filter(key =>
      /^(DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|TRAVIS|GITHUB_)/i.test(key)
    )
    .map(key => `-e ${key}="${process.env[key]}"`)
    .join(' ');

  const formats = opts.format.join(' ');
  const archFlags = opts.arch.map(a => `--${a}`).join(' ');

  const isWindowsBuild = targetKey === 'windows';

  let dockerCmd;

  // * Checks if we're on a Unix-like system (macos/Linux)
  const isUnix = typeof process.getuid === 'function';
  const ownershipFix = isUnix
    ? ` && chown -R ${process.getuid()}:${process.getgid()} /project`
    : '';

  if (isWindowsBuild) {
    // ! Hooooooly unreadable code.
    // * Windows builds need Wine setup and extra environment variables

    // * Windows build
    dockerCmd = `docker run --rm \
    ${envVars} \
    --env ELECTRON_CACHE="/root/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
    --env WINEDEBUG=-all \
    --env WINEPREFIX=/root/.wine \
    --env npm_config_store_dir="/root/.npm" \
    -v ${process.cwd()}:/project \
    -v ${project}-node-modules:/project/node_modules \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    ${image} \
    /bin/bash -c "cd /project && wineboot --init && sleep 2 && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags}${ownershipFix}"`;
  } else {
    // * Unix build (Linux/macOS)
    dockerCmd = `docker run --rm \
    ${envVars} \
    --env ELECTRON_CACHE="/root/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
    --env npm_config_store_dir="/root/.npm" \
    -v ${process.cwd()}:/project \
    -v ${project}-node-modules:/project/node_modules \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    ${image} \
    /bin/bash -c "cd /project && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags}${ownershipFix}"`;
  }

  console.log(
    `Running ${isWindowsBuild ? 'Wine-enabled Docker' : 'Docker'} build...`
  );
  // * Execute the Docker command and pipe output directly to our terminal
  execSync(dockerCmd, { stdio: 'inherit' });
}

// $ Runs electron-builder directly on the host system (no Docker)
async function runNativeBuild(opts, targetKey) {
  console.log('Starting native build...');

  const outDir = path.resolve(opts.output || 'dist');
  fs.mkdirSync(outDir, { recursive: true });

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

  // * Electron Builder configuration - use correct platform property name
  const config = {
    appId: 'com.fchat.horizon',
    productName: 'F-Chat Horizon',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
    directories: { output: outDir },
    files: ['dist/**/*', 'node_modules/**/*', 'package.json'],
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
  if (shouldUseDocker(opts, targetKey)) {
    runDockerBuild(opts, targetKey);
  } else {
    await runNativeBuild(opts, targetKey);
  }
})();

// & I am so sorry for this crap code.
// & — Rose
