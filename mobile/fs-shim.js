// Minimal fs shim for browser/WebView
// Mobile app uses NativeFile Android interface instead

console.log('[fs-shim] Loading fs shim module');

// Provide stubs that won't crash if called
module.exports = {
  read: function() {
    console.warn('[fs-shim] fs.read called but not implemented');
  },
  readFile: function() {
    console.warn('[fs-shim] fs.readFile called but not implemented');
  },
  readFileSync: function() {
    console.warn('[fs-shim] fs.readFileSync called but not implemented');
    return '';
  },
  writeFile: function() {
    console.warn('[fs-shim] fs.writeFile called but not implemented');
  },
  writeFileSync: function() {
    console.warn('[fs-shim] fs.writeFileSync called but not implemented');
  },
  existsSync: function() {
    return false;
  },
  mkdirSync: function() {
    console.warn('[fs-shim] fs.mkdirSync called but not implemented');
  },
  readdirSync: function() {
    return [];
  },
  statSync: function() {
    return { isDirectory: () => false, isFile: () => false };
  },
  unlinkSync: function() {
    console.warn('[fs-shim] fs.unlinkSync called but not implemented');
  },
};
