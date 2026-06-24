import { execSync } from 'child_process';
import path from 'path';

const DOCKER_IMAGES = {
  linux: 'electronuserland/builder',
  windows: 'electronuserland/builder:wine'
};

const ENV_VAR_PATTERNS =
  /^(DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|TRAVIS|GITHUB_)/i;

const BASE_ENV_VARS = {
  ELECTRON_CACHE: '/root/.cache/electron',
  ELECTRON_BUILDER_CACHE: '/root/.cache/electron-builder',
  npm_config_store_dir: '/root/.npm'
};

const WINDOWS_ENV_VARS = {
  WINEDEBUG: '-all',
  WINEPREFIX: '/root/.wine'
};

export function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isRunningInGitHubActions() {
  return process.env.GITHUB_ACTIONS === 'true';
}

export function shouldUseDocker(opts, targetKey, colors) {
  // ! macOS builds don't work under Docker
  if (opts.docker === false || targetKey === 'macos') return false;

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

function generateVolumeMappings(project) {
  const rootDir = path.resolve(process.cwd(), '..');
  const volumes = [
    `-v ${process.cwd()}:/project`,
    `-v ${process.cwd()}/node_modules:/project/node_modules`,
    `-v ${rootDir}/node_modules:/project/../node_modules`,
    `-v ~/.cache/electron:/root/.cache/electron`,
    `-v ~/.cache/electron-builder:/root/.cache/electron-builder`
  ];

  return volumes.join(' \\\n    ');
}

function generateBuildCommand(targetKey, formats, archFlags, ownershipFix) {
  const baseCommand = `cd /project && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags}${ownershipFix}`;

  if (targetKey === 'windows') {
    return `wineboot --init && sleep 2 && ${baseCommand}`;
  }

  return baseCommand;
}

export function runDockerBuild(opts, targetKey) {
  const image = DOCKER_IMAGES[targetKey] || DOCKER_IMAGES.linux;
  const project = path.basename(process.cwd());

  const envVars = generateEnvVars(targetKey);
  const volumeMappings = generateVolumeMappings(project);

  const formats = opts.format.join(' ');
  const archFlags = opts.arch.map(a => `--${a}`).join(' ');

  const isWindowsBuild = targetKey === 'windows';

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

  execSync(dockerCmd, { stdio: 'inherit' });
}
