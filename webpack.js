const webpack = require('webpack');
const path = require('path');

const mode = process.argv[2];
let config = require(path.resolve(process.argv[3] || 'webpack.config'));
if (typeof config === 'function') config = config(mode);
config = Array.isArray(config) ? config : [config];
for (const item of config) item.mode = mode === 'watch' ? 'development' : mode;

let lastHash = null;
function compilerCallback(err, stats) {
  if (mode !== 'watch' || err) compiler.purgeInputFileSystem();
  if (err) {
    lastHash = null;
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
    process.exit(1);
  }
  if (stats.hash !== lastHash) {
    lastHash = stats.hash;
    const statsString = stats.toString({
      colors: require('supports-color'),
      context: config[0].context,
      cached: false,
      cachedAssets: false,
      exclude: ['node_modules']
    });
    if (statsString) process.stdout.write(statsString + '\n');
  }

  if (mode !== 'watch' && stats.hasErrors()) {
    process.exitCode = 2;
    console.error('FULL ERROR', stats.stats[0].compilation.errors[0]);
  }
}

console.log(config);

const compiler = webpack(config);
if (mode === 'watch') compiler.watch({}, compilerCallback);
else compiler.run(compilerCallback);
