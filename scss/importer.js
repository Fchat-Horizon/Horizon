const path = require('path');
const fs = require('fs');

module.exports = function importer(url) {
  if (url[0] === '~') {
    const file = url.substr(1);
    for (const base of require.resolve.paths('')) {
      const filePath = path.resolve(base, file);
      if (fs.existsSync(path.dirname(filePath))) {
        url = filePath;
        break;
      }
    }
  }
  return { file: url };
};
