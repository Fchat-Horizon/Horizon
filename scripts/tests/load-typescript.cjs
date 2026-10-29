const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

// Run the real source without starting Electron or mounting the Vue UI.
function loadTypeScript(relative, mocks = {}, globals = {}, cache = new Map()) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const requireFromFile = createRequire(filename);
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filename), name);
      for (const file of [resolved + '.ts', path.join(resolved, 'index.ts')]) {
        if (fs.existsSync(file))
          return loadTypeScript(
            path.relative(root, file),
            mocks,
            globals,
            cache
          );
      }
    }
    return requireFromFile(name);
  };
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true
    }
  });
  const context = vm.createContext({
    Buffer,
    console,
    process,
    URL,
    AbortController,
    TextDecoder,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...globals
  });
  vm.runInContext(
    `(function(require, module, exports, __filename, __dirname) {${outputText}\n})`,
    context,
    { filename }
  )(localRequire, module, module.exports, filename, path.dirname(filename));
  return module.exports;
}

module.exports = { loadTypeScript };
