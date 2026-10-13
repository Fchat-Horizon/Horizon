import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const portableDataDirName = 'horizon-data';

function getAppDir(): string {
  // ^ The Windows portable exe and AppImages run from a temporary extraction
  if (process.env.PORTABLE_EXECUTABLE_DIR)
    return process.env.PORTABLE_EXECUTABLE_DIR;
  return path.dirname(process.env.APPIMAGE || app.getPath('exe'));
}

const installedLogDirectory = path.join(app.getPath('userData'), 'data');
const portableDataDir = path.join(getAppDir(), portableDataDirName);

// ! Not on macOS: electron-log hardcodes ~/Library/Logs, and Gatekeeper
// translocation hides the folder next to apps that haven't been moved
export const isPortable =
  process.platform !== 'darwin' && fs.existsSync(portableDataDir);

if (isPortable) {
  app.setPath('userData', portableDataDir);
  app.setAppLogsPath(path.join(portableDataDir, 'logs'));
}

function isPathInside(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function resolveLogDirectory(stored: string): string {
  // ^ Settings copied from an installed copy still point at its data folder
  if (isPortable && path.resolve(stored) === installedLogDirectory)
    return path.join(portableDataDir, 'data');
  return path.resolve(app.getPath('userData'), stored);
}

// ^ Relative, so the folder survives moving between machines and drive letters
export function toStoredLogDirectory(dir: string): string {
  if (!isPortable || !isPathInside(dir, portableDataDir)) return dir;
  return path.relative(portableDataDir, dir);
}
