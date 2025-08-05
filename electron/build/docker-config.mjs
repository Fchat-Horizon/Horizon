/**
 * NOTE: Docker configuration and utilities for Horizon build system
 */

import { execSync } from 'child_process';
import path from 'path';

// * Docker images for different target platforms
const DOCKER_IMAGES = {
  linux: 'electronuserland/builder',
  windows: 'electronuserland/builder:wine'
};

// * Environment variable patterns to pass through to Docker
const ENV_VAR_PATTERNS =
  /^(DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|TRAVIS|GITHUB_)/i;

// * Base environment variables for all Docker builds
const BASE_ENV_VARS = {
  ELECTRON_CACHE: '/root/.cache/electron',
  ELECTRON_BUILDER_CACHE: '/root/.cache/electron-builder',
  npm_config_store_dir: '/root/.npm'
};

// * Additional environment variables for Windows builds
const WINDOWS_ENV_VARS = {
  WINEDEBUG: '-all',
  WINEPREFIX: '/root/.wine'
};

// $ Yo, we got docker?
// * Tries to run 'docker info' to see if Docker is actually installed and running
export function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// $ Are we running in github actions?
export function isRunningInGitHubActions() {
  return process.env.GITHUB_ACTIONS === 'true';
}

// $ Nice, nice, should we use docker?
// * Determines whether to use Docker based on user preference and availability
export function shouldUseDocker(opts, targetKey, colors) {
  // * Never use Docker for macOS (doesn't work) or if explicitly disabled
  if (opts.docker === false || targetKey === 'macos') return false;

  // * Check if we're running in GitHub Actions
  if (isRunningInGitHubActions()) {
    console.log(
      `${colors.yellow}GitHub Actions detected - using native build instead of Docker${colors.reset}`
    );
    return false;
  }

  if (opts.docker) {
    if (!isDockerAvailable()) {
      console.error(
        `${colors.red}Docker requested but not available${colors.reset}`
      );
      process.exit(1);
    }
    return true;
  }

  return isDockerAvailable();
}

// * Generate environment variables string for Docker command
function generateEnvVars(targetKey) {
  const hostEnvVars = Object.keys(process.env)
    .filter(key => ENV_VAR_PATTERNS.test(key))
    .map(key => `-e ${key}="${process.env[key]}"`)
    .join(' ');

  const baseEnvVars = Object.entries(BASE_ENV_VARS)
    .map(([key, value]) => `--env ${key}="${value}"`)
    .join(' ');

  const platformEnvVars =
    targetKey === 'windows'
      ? Object.entries(WINDOWS_ENV_VARS)
          .map(([key, value]) => `--env ${key}="${value}"`)
          .join(' ')
      : '';

  return [hostEnvVars, baseEnvVars, platformEnvVars].filter(Boolean).join(' ');
}

// * Generate volume mappings for Docker command
function generateVolumeMappings(project) {
  const volumes = [
    `-v ${process.cwd()}:/project`,
    `-v ${project}-node-modules:/project/node_modules`,
    `-v ~/.cache/electron:/root/.cache/electron`,
    `-v ~/.cache/electron-builder:/root/.cache/electron-builder`
  ];

  return volumes.join(' \\\n    ');
}

// * Generate the build command for Docker container
function generateBuildCommand(targetKey, formats, archFlags, ownershipFix) {
  const baseCommand = `cd /project && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags}${ownershipFix}`;

  if (targetKey === 'windows') {
    return `wineboot --init && sleep 2 && ${baseCommand}`;
  }

  return baseCommand;
}

// $ If we're meant to, and have it available, run docker.
// * This function is a hot mess but it works, mostly
export function runDockerBuild(opts, targetKey) {
  const image = DOCKER_IMAGES[targetKey] || DOCKER_IMAGES.linux;
  const project = path.basename(process.cwd());

  const envVars = generateEnvVars(targetKey);
  const volumeMappings = generateVolumeMappings(project);

  const formats = opts.format.join(' ');
  const archFlags = opts.arch.map(a => `--${a}`).join(' ');

  const isWindowsBuild = targetKey === 'windows';

  // * Checks if we're on a Unix-like system (macos/Linux)
  const isUnix = typeof process.getuid === 'function';
  const ownershipFix = isUnix
    ? ` && chown -R ${process.getuid()}:${process.getgid()} /project`
    : '';

  const buildCommand = generateBuildCommand(
    targetKey,
    formats,
    archFlags,
    ownershipFix
  );

  const dockerCmd = `docker run --rm \\
    ${envVars} \\
    ${volumeMappings} \\
    ${image} \\
    /bin/bash -c "${buildCommand}"`;

  console.log(
    `Running ${isWindowsBuild ? 'Wine-enabled Docker' : 'Docker'} build...`
  );

  // * Execute the Docker command and pipe output directly to our terminal
  execSync(dockerCmd, { stdio: 'inherit' });
}
