// os shim for browser/WebView

module.exports = {
  EOL: '\n',
  arch: function () {
    return 'arm64';
  },
  cpus: function () {
    return [];
  },
  endianness: function () {
    return 'LE';
  },
  freemem: function () {
    return 0;
  },
  homedir: function () {
    return '/';
  },
  hostname: function () {
    return 'localhost';
  },
  loadavg: function () {
    return [0, 0, 0];
  },
  networkInterfaces: function () {
    return {};
  },
  platform: function () {
    return 'android';
  },
  release: function () {
    return '';
  },
  tmpdir: function () {
    return '/tmp';
  },
  totalmem: function () {
    return 0;
  },
  type: function () {
    return 'Android';
  },
  uptime: function () {
    return 0;
  },
  userInfo: function () {
    return { username: 'user', homedir: '/', shell: null, uid: -1, gid: -1 };
  }
};
