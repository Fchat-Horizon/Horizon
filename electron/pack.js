process.env.DEBUG = 'electron-windows-installer:main';
const path = require('path');
const pkg = require(path.join(__dirname, 'package.json'));
const fs = require('fs');
const child_process = require('child_process');
const _ = require('lodash');
const axios = require('axios');

const distDir = path.join(__dirname, 'dist');
const isBeta = pkg.version.indexOf('beta') !== -1;
const modules = path.join(__dirname, 'app', 'node_modules');

// const spellcheckerPath = 'spellchecker/build/Release/spellchecker.node',
//     keytarPath = 'keytar/build/Release/keytar.node',
//     integerPath = 'integer/build/Release/integer.node',
//     betterSqlite3 = 'better-sqlite3/build/Release/better_sqlite3.node';
//
// mkdir(path.dirname(path.join(modules, spellcheckerPath)));
// mkdir(path.dirname(path.join(modules, keytarPath)));
// fs.copyFileSync(require.resolve(spellcheckerPath), path.join(modules, spellcheckerPath));
// fs.copyFileSync(require.resolve(keytarPath), path.join(modules, keytarPath));

const includedPaths = [
  // 'spellchecker/build/Release/spellchecker.node',
  // 'keytar/build/Release/keytar.node',
  'throat',
  'node-fetch',
  'jquery'
];

_.each(includedPaths, p => {
  let from = p;
  let to = p;

  if (_.isArray(p)) {
    from = p[0];
    to = p[1];
  }

  fs.mkdirSync(path.dirname(path.join(modules, to)), { recursive: true });
  fs.copyFileSync(require.resolve(from), path.join(modules, to));
});

require('electron-packager')({
  dir: path.join(__dirname, 'app'),
  out: distDir,
  overwrite: true,
  name: 'F-Chat',
  icon: path.join(__dirname, 'build', 'icon'),
  ignore: ['\.map$'],
  osxSign: process.argv.length > 2 ? { identity: process.argv[2] } : false,
  prune: false,
  arch: process.platform === 'darwin' ? ['x64', 'arm64'] : ['x64', 'arm64']
}).then(
  async appPaths => {
    if (process.env.SKIP_INSTALLER) {
      return;
    }

    if (process.platform === 'win32') {
      console.log('Creating Windows installer');
      const icon = path.join(__dirname, 'build', 'icon.ico');

      for (const appPath of appPaths) {
        console.log('WinAppPath', appPath);
        const appArch = appPath.match(/F-Chat-win32-([a-zA-Z0-9]+)$/)[1];
        const appArchLong = appArch === 'x64' ? 'x86_64' : 'aarch64';
        const setupName = `F-Chat-Rising-Setup-win-${appArch}.exe`;
        const distFinal = path.join(distDir, appArch);

        console.log('DistFinal', distFinal);

        fs.mkdirSync(distFinal, { recursive: true });

        if (fs.existsSync(path.join(distFinal, setupName))) {
          fs.unlinkSync(path.join(distFinal, setupName));
        }

        const nupkgName = path.join(distFinal, `fchat-${pkg.version}-full.nupkg`);
        const deltaName = path.join(distFinal, `fchat-${pkg.version}-delta.nupkg`);

        if (fs.existsSync(nupkgName)) fs.unlinkSync(nupkgName);
        if (fs.existsSync(deltaName)) fs.unlinkSync(deltaName);

        if (process.argv.length <= 3) console.warn('Warning: Creating unsigned installer');

        try {
          await require('electron-winstaller').createWindowsInstaller({
            appDirectory: appPath,
            outputDirectory: distFinal,
            iconUrl: 'file:///%localappdata%\\fchat\\app.ico',
            setupIcon: icon,
            noMsi: true,
            exe: 'F-Chat.exe',
            title: 'F-Chat Horizon',
            setupExe: setupName,
            name: 'fchat'
            // remoteReleases: 'https://client.f-list.net/win32/' + (isBeta ? '?channel=beta' : ''),
            // signWithParams: process.argv.length > 3 ? `/a /f ${process.argv[2]} /p ${process.argv[3]} /fd sha256 /tr http://timestamp.digicert.com /td sha256` : undefined
          });
        } catch (e) {
          console.error(`Error while creating installer: ${e.message}`);
          throw e;
        }
      }
    } else if (process.platform === 'darwin') {
      console.log('Creating Mac DMG');

      _.each(
        [
          { name: 'Intel', path: appPaths[0] },
          { name: 'M1', path: appPaths[1] }
        ],
        arch => {
          console.log(arch.name, arch.path);

          const target = path.join(distDir, `F-Chat Horizon ${arch.name}.dmg`);
          if (fs.existsSync(target)) fs.unlinkSync(target);
          const appPath = path.join(arch.path, 'F-Chat.app');
          if (process.argv.length <= 2) console.warn('Warning: Creating unsigned DMG');
          require('appdmg')({
            basepath: arch.path,
            target,
            specification: {
              title: 'F-Chat Horizon',
              icon: path.join(__dirname, 'build', 'icon.png'),
              background: path.join(__dirname, 'build', 'dmg.png'),
              contents: [
                { x: 555, y: 345, type: 'link', path: '/Applications' },
                { x: 555, y: 105, type: 'file', path: appPath }
              ],
              'code-sign':
                process.argv.length > 2
                  ? {
                      'signing-identity': process.argv[2]
                    }
                  : undefined
            }
          }).on('error', console.error);
          const zipName = `F-Chat_Rising_${arch.name}_${pkg.version}.zip`;
          const zipPath = path.join(distDir, zipName);
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          const child = child_process.spawn('zip', ['-r', '-y', '-9', zipPath, 'F-Chat.app'], { cwd: arch.path });
          child.stdout.on('data', () => {});
          child.stderr.on('data', data => console.error(data.toString()));
          fs.writeFileSync(
            path.join(distDir, 'updates.json'),
            JSON.stringify({
              releases: [{ version: pkg.version, updateTo: { url: 'https://client.f-list.net/darwin/' + zipName } }],
              currentRelease: pkg.version
            })
          );
        }
      );
    } else {
      console.log('Creating Linux AppImage');

      async function downloadAppImageTool(appImageBase) {
        const localArch = process.arch === 'x64' ? 'x86_64' : 'aarch64';
        const url = `https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${localArch}.AppImage`;
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const appImagePath = path.join(appImageBase, 'appimagetool.AppImage');

        console.log('Downloading', url, appImageBase, typeof res.data);

        fs.writeFileSync(appImagePath, res.data);
        fs.chmodSync(appImagePath, 0o755);

        const result = child_process.spawnSync(appImagePath, ['--appimage-extract'], { cwd: appImageBase });

        if (result.status !== 0) {
          console.log('Run failed', 'APPIMAGE EXTRACT', {
            status: result.status,
            call: result.error?.syscall,
            args: result.error?.spawnargs,
            path: result.error?.path,
            code: result.error?.code,
            stdout: String(result.stdout),
            stderr: String(result.stderr)
          });
        }

        return appImagePath;
      }

      const appImageBase = path.join(distDir, 'downloaded');
      fs.mkdirSync(appImageBase, { recursive: true });

      const appImagePath = await downloadAppImageTool(appImageBase);

      for (const appPath of appPaths) {
        const appArch = appPath.match(/F-Chat-linux-([a-zA-Z0-9]+)$/)[1];
        const appArchLong = appArch === 'x64' ? 'x86_64' : 'aarch64';
        const buildPath = path.join(__dirname, 'build');

        fs.renameSync(path.join(appPath, 'F-Chat'), path.join(appPath, 'AppRun'));
        fs.copyFileSync(path.join(buildPath, 'icon.png'), path.join(appPath, 'icon.png'));

        const libDir = path.join(appPath, 'usr', 'lib'),
          libSource = path.join(buildPath, 'linux-libs', appArchLong);

        fs.mkdirSync(libDir, { recursive: true });

        for (const file of fs.readdirSync(libSource)) {
          fs.copyFileSync(path.join(libSource, file), path.join(libDir, file));
        }

        fs.symlinkSync(path.join(appPath, 'icon.png'), path.join(appPath, '.DirIcon'));
        fs.writeFileSync(
          path.join(appPath, 'fchat.desktop'),
          '[Desktop Entry]\nName=F-Chat\nExec=AppRun\nIcon=icon\nType=Application\nCategories=GTK;GNOME;Utility;'
        );

        const args = [
          appPath,
          `fchat.${appArch}.AppImage`,
          '-u',
          `gh-releases-zsync|hearmeneigh|fchat-rising|latest|F-Chat-Rising-linux-${appArch}.AppImage.zsync`
        ];

        if (process.argv.length > 2) {
          args.push('-s', '--sign-key', process.argv[2]);
        } else {
          console.warn('Warning: Creating unsigned AppImage');
        }

        if (process.argv.length > 3) {
          args.push('--sign-args', `--no-tty  --pinentry-mode loopback --yes --passphrase=${process.argv[3]}`);
        }

        const appRunResult = child_process.spawnSync(path.join(appImageBase, 'squashfs-root', 'AppRun'), args, {
          cwd: appImageBase,
          env: { ARCH: appArchLong }
        });

        if (appRunResult.status !== 0) {
          console.log('Run failed', 'APPRUN', appArch, {
            status: appRunResult.status,
            call: appRunResult.error?.syscall,
            args: appRunResult.error?.spawnargs,
            path: appRunResult.error?.path,
            code: appRunResult.error?.code,
            stdout: String(appRunResult.stdout),
            stderr: String(appRunResult.stderr)
          });
        }
      }
    }
  },
  e => console.log(`Error while packaging: ${e.message}`)
);
