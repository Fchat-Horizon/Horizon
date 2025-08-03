/**
 * NOTE: Hey! Welcome to Rose's build script for the Horizon Project.
 */

import { program } from 'commander';
import { arch as systemArch } from 'os';
import { build } from 'electron-builder';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const COLORS = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m'
};

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

function findTargetOS(osInput) {
  return Object.keys(OS_CONFIGS).find(
    key =>
      key === osInput.toLowerCase() ||
      OS_CONFIGS[key].aliases.includes(osInput.toLowerCase())
  );
}

function setDefaults(opts, config) {
  const { formats: defaultFormats, arches: defaultArches } = config;

  opts.format = opts.format?.length ? opts.format : [defaultFormats[0]];
  opts.arch = opts.arch?.length
    ? opts.arch
    : [defaultArches.includes(systemArch()) ? systemArch() : defaultArches[0]];
}

function validateOptions(opts, config, targetKey) {
  const { formats: validFormats, arches: validArches } = config;
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

function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function shouldUseDocker(opts, targetKey) {
  if (opts.docker === false || targetKey === 'macos') return false;

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

  // Both Linux and Windows builds run as user
  const isWindowsBuild = targetKey === 'windows';

  let dockerCmd;

  if (isWindowsBuild) {
    // Windows build with Wine - run as root for Wine compatibility, fix ownership after
    dockerCmd = `docker run --rm -ti \
    ${envVars} \
    --env ELECTRON_CACHE="/tmp/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/tmp/.cache/electron-builder" \
    --env WINEDEBUG=-all \
    --env WINEPREFIX=/root/.wine \
    -v ${process.cwd()}:/project \
    -v ${project}-node-modules:/project/node_modules \
    -v ~/.cache/electron:/tmp/.cache/electron \
    -v ~/.cache/electron-builder:/tmp/.cache/electron-builder \
    ${image} \
    /bin/bash -c "cd /project && wineboot --init && sleep 2 && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags} && chown -R ${process.getuid()}:${process.getgid()} /project/dist"`;
  } else {
    // Linux build - use user mapping as before
    dockerCmd = `docker run --rm -ti \
    --user ${process.getuid()}:${process.getgid()} \
    ${envVars} \
    --env ELECTRON_CACHE="/tmp/.cache/electron" \
    --env ELECTRON_BUILDER_CACHE="/tmp/.cache/electron-builder" \
    -v ${process.cwd()}:/project \
    -v ${project}-node-modules:/project/node_modules \
    -v ~/.cache/electron:/tmp/.cache/electron \
    -v ~/.cache/electron-builder:/tmp/.cache/electron-builder \
    ${image} \
    /bin/bash -c "cd /project && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags}"`;
  }

  console.log(
    `Running ${isWindowsBuild ? 'Wine-enabled Docker' : 'Docker'} build...`
  );
  execSync(dockerCmd, { stdio: 'inherit' });
}

async function runNativeBuild(opts, targetKey) {
  console.log('Starting native build...');

  // Read the existing electron-builder config from package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const buildConfig = packageJson.build || {};

  const platformMap = {
    linux: 'linux',
    macos: 'mac',
    windows: 'win'
  };

  const targets = opts.format.map(format => `${format}:${opts.arch.join(',')}`);

  const config = {
    ...buildConfig,
    [platformMap[targetKey]]: {
      ...buildConfig[platformMap[targetKey]],
      target: targets
    },
    ...(opts.output && {
      directories: {
        ...buildConfig.directories,
        output: opts.output
      }
    })
  };

  await build({ config });
  console.log('Build completed successfully!');
}

// Main execution
(async () => {
  const opts = setupProgram().parse(process.argv).opts();

  const targetKey = findTargetOS(opts.os);
  if (!targetKey) {
    console.error(`${COLORS.red}Invalid OS: ${opts.os}${COLORS.reset}`);
    process.exit(1);
  }

  const targetConfig = OS_CONFIGS[targetKey];
  setDefaults(opts, targetConfig);
  validateOptions(opts, targetConfig, targetKey);

  console.log(
    `${COLORS.cyan}Building for ${targetKey} | formats: ${opts.format.join(', ')} | arches: ${opts.arch.join(', ')}${COLORS.reset}`
  );

  if (shouldUseDocker(opts, targetKey)) {
    runDockerBuild(opts, targetKey);
  } else {
    await runNativeBuild(opts, targetKey);
  }
})();

// & I am so sorry for this crap code.
// & -- Rose
