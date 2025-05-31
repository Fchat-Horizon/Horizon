import * as electron from 'electron';
import * as path from 'path';
import * as remoteMain from '@electron/remote/main';

// tslint:disable-next-line:no-require-imports
const pngIcon = path.join(
  __dirname,
  <string>require('./build/icon.png').default
);

// tslint:disable-next-line:no-require-imports
const winIcon = path.join(
  __dirname,
  <string>require('./build/icon.ico').default
);
