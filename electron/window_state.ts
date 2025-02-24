import { app, screen } from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.join(app.getPath('userData'), 'data');
const windowStatePath = path.join(baseDir, 'window.json');

interface SavedWindowState {
  x?: number;
  y?: number;
  height: number;
  width: number;
  maximized: boolean;
}

function mapToScreen(state: SavedWindowState): SavedWindowState {
  let x = state.x !== undefined ? state.x : 0;
  let y = state.y !== undefined ? state.y : 0;
  const primaryDisplay = screen.getPrimaryDisplay();
  const targetDisplay = screen.getDisplayMatching({ x, y, height: state.height, width: state.width });
  if (primaryDisplay.scaleFactor !== 1 && targetDisplay.id !== primaryDisplay.id) {
    x /= primaryDisplay.scaleFactor;
    y /= primaryDisplay.scaleFactor;
  }
  state.x = x !== 0 ? x : undefined;
  state.y = y !== 0 ? y : undefined;
  return state;
}

export function setSavedWindowState(window: Electron.BrowserWindow): void {
  const bounds = window.getBounds();
  const maximized = window.isMaximized();
  const windowState: SavedWindowState = {
    height: bounds.height,
    maximized,
    width: bounds.width,
    x: bounds.x,
    y: bounds.y
  };
  fs.writeFileSync(windowStatePath, JSON.stringify(windowState));
}

export function getSavedWindowState(): SavedWindowState {
  const defaultState = {
    height: 768,
    maximized: false,
    width: 1024
  };
  if (!fs.existsSync(windowStatePath)) return defaultState;
  try {
    let savedState = <SavedWindowState>JSON.parse(fs.readFileSync(windowStatePath, 'utf-8'));
    savedState = mapToScreen(savedState);
    return savedState;
  } catch (e) {
    log.error(e);
    return defaultState;
  }
}
