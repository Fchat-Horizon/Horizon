const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const packageJson = require('./package.json');
const { DefinePlugin, ProvidePlugin } = require('webpack');
const APP_VERSION = process.env.APP_VERSION || packageJson.version;
const APP_COMMIT =
  process.env.APP_COMMIT ||
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'ignore']
      })
        .toString()
        .trim();
    } catch (error) {
      return 'unknown';
    }
  })();

const nodeModulesPath = path.resolve(__dirname, '../node_modules');

const sharedConfig = {
  snapshot: {
    managedPaths: [nodeModulesPath, path.resolve(__dirname, 'node_modules')]
  }
};

const mainConfig = {
    entry: [
      path.join(__dirname, 'main.ts'),
      path.join(__dirname, 'package.json')
    ],
    output: {
      path: __dirname + '/app',
      filename: 'main.js'
    },
    context: __dirname,
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: {
            target: 'es2022',
            tsconfig: path.join(__dirname, 'tsconfig-main.json')
          }
        },
        {
          test: path.join(__dirname, 'package.json'),
          loader: 'file-loader',
          options: { name: 'package.json' },
          type: 'javascript/auto'
        },
        {
          test: /\.(png|ico|html)$/,
          loader: 'file-loader',
          options: { name: '[name].[ext]' }
        },
        { test: /\.raw\.js$/, loader: 'raw-loader' }
      ]
    },
    node: {
      __dirname: false,
      __filename: false
    },
    plugins: [
      new DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(APP_VERSION),
        'process.env.APP_COMMIT': JSON.stringify(APP_COMMIT)
      })
    ],
    resolve: {
      extensions: ['.ts', '.js']
    },
    experiments: { cacheUnaffected: true },
    optimization: {
      moduleIds: 'named',
      chunkIds: 'named'
    }
  },
  rendererConfig = {
    entry: {
      chat: [
        path.join(__dirname, 'chat.ts'),
        path.join(__dirname, 'index.html')
      ],
      window: [
        path.join(__dirname, 'window.ts'),
        path.join(__dirname, 'window.html'),
        path.join(__dirname, 'build', 'tray@2x.png')
      ],
      settings: [
        path.join(__dirname, 'settings.ts'),
        path.join(__dirname, 'settings.html'),
        path.join(__dirname, 'build', 'tray@2x.png')
      ],
      changelog: [
        path.join(__dirname, 'changelog.ts'),
        path.join(__dirname, 'changelog.html'),
        path.join(__dirname, 'build', 'tray@2x.png')
      ],
      exporter: [
        path.join(__dirname, 'exporter.ts'),
        path.join(__dirname, 'exporter.html'),
        path.join(__dirname, 'build', 'tray@2x.png')
      ],
      about: [
        path.join(__dirname, 'about.ts'),
        path.join(__dirname, 'about.html'),
        path.join(__dirname, 'build', 'tray@2x.png')
      ]
    },
    output: {
      path: __dirname + '/app',
      publicPath: './',
      filename: '[name].js'
    },
    context: __dirname,
    /*
    ! Renderers are context-isolated and sandboxed (no Node), so they build
    ! as plain web bundles. Electron and Node built-ins resolve to the shims
    ! below, which talk to the preload bridge (preload.ts).
    */
    target: 'web',
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            compilerOptions: {
              preserveWhitespace: false
            }
          }
        },
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'es2022',
            tsconfig: path.join(__dirname, 'tsconfig-renderer.json')
          }
        },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
        { test: /\.(woff2?)$/, loader: 'file-loader' },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
        {
          test: /\.(wav|mp3|ogg)$/,
          exclude: /sound-themes/,
          loader: 'file-loader',
          options: { name: 'sounds/[name].[ext]' }
        },
        {
          test: /\.(png|ico|html)$/,
          loader: 'file-loader',
          options: { name: '[name].[ext]' }
        },
        {
          test: /\.vue\.scss/,
          // loader: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}},'sass-loader']
          use: [
            'vue-style-loader',
            { loader: 'css-loader', options: { esModule: false } },
            {
              loader: 'sass-loader',
              options: {
                warnRuleAsWarning: false,
                sassOptions: {
                  quietDeps: true,
                  // Add any specific codes here; '*' not supported, so rely on custom logger below.
                  silenceDeprecations: [
                    'import',
                    'color-functions',
                    'global-builtin',
                    'slash-div',
                    'function-units',
                    'if-function'
                  ],
                  verbose: false
                }
              }
            }
          ]
        },
        {
          test: /\.vue\.css/,
          // loader: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}}]
          use: [
            'vue-style-loader',
            { loader: 'css-loader', options: { esModule: false } }
          ]
        },
        {
          test: /\.scss$/,
          exclude: /\.vue$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { esModule: false } },
            {
              loader: 'sass-loader',
              options: {
                warnRuleAsWarning: false,
                sassOptions: {
                  quietDeps: true,
                  silenceDeprecations: [
                    'import',
                    'color-functions',
                    'global-builtin',
                    'slash-div',
                    'function-units',
                    'if-function'
                  ],
                  verbose: false
                }
              }
            }
          ]
        },
        { test: /\.raw\.js$/, loader: 'raw-loader' }
      ]
    },
    node: {
      __dirname: false,
      __filename: false
    },
    plugins: [
      new DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(APP_VERSION),
        'process.env.APP_COMMIT': JSON.stringify(APP_COMMIT)
      }),
      // setImmediate is a Node global; map it to a setTimeout-based shim.
      new ProvidePlugin({
        setImmediate: [path.join(__dirname, 'timers-shim.ts'), 'setImmediate'],
        clearImmediate: [
          path.join(__dirname, 'timers-shim.ts'),
          'clearImmediate'
        ]
      }),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.join(__dirname, 'tsconfig-renderer.json')
        }
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path
              .resolve(__dirname, '..', 'chat', 'preview', 'assets', '**', '*')
              .replace(/\\/g, '/'),
            to: path.join('preview', 'assets'),
            context: path.resolve(__dirname, '..', 'chat', 'preview', 'assets')
          },
          {
            from: path
              .resolve(__dirname, '..', 'assets', '**', '*')
              .replace(/\\/g, '/'),
            to: path.join('assets'),
            context: path.resolve(__dirname, '..', 'assets')
          },
          {
            from: path
              .resolve(__dirname, '..', 'chat', 'sound-themes', '**', '*')
              .replace(/\\/g, '/'),
            to: path.join('sound-themes'),
            context: path.resolve(__dirname, '..', 'chat', 'sound-themes')
          },
          {
            from: path.join(__dirname, 'package.json'),
            to: 'package.json',
            transform(content) {
              const json = JSON.parse(content.toString());
              delete json.build; // Remove the "build" field
              return JSON.stringify(json, null, 2);
            }
          }
        ]
      })
    ],
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.css'],
      alias: {
        electron$: path.join(__dirname, 'electron-shim.ts'),
        querystring$: path.join(__dirname, 'querystring-shim.ts'),
        path: require.resolve('path-browserify')
      }
    },
    experiments: { cacheUnaffected: true },
    optimization: {
      splitChunks: { chunks: 'all', minChunks: 2, name: 'common' },
      moduleIds: 'named',
      chunkIds: 'named'
    }
  };

/*
 * The preload runs sandboxed inside every renderer; everything it needs
 * (including electron-log/preload) must be bundled in, with only the
 * `electron` module left external.
 */
const preloadConfig = _.assign(_.cloneDeep(mainConfig), {
  entry: [path.join(__dirname, 'preload.ts')],
  output: {
    path: __dirname + '/app',
    filename: 'preload.js'
  },
  target: 'electron-preload',
  plugins: [
    new DefinePlugin({
      'process.env.APP_VERSION': JSON.stringify(APP_VERSION),
      'process.env.APP_COMMIT': JSON.stringify(APP_COMMIT)
    })
  ]
});

const storeWorkerEndpointConfig = _.assign(_.cloneDeep(mainConfig), {
  entry: [
    path.join(
      __dirname,
      '..',
      'learn',
      'store',
      'worker',
      'store.worker.endpoint.ts'
    )
  ],
  output: {
    path: __dirname + '/app',
    filename: 'storeWorkerEndpoint.js',
    globalObject: 'this'
  },

  target: 'webworker',

  node: {
    global: true
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      /*
      ! electron-log's renderer transport needs window.__electronLog, which
      ! does not exist in a worker scope; log to the console instead.
      */
      'electron-log$': path.join(
        __dirname,
        '..',
        'learn',
        'store',
        'worker',
        'log-stub.ts'
      )
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2022',
          tsconfig: path.join(__dirname, 'tsconfig-renderer.json')
        }
      }
    ]
  },

  experiments: { cacheUnaffected: true },
  optimization: {
    moduleIds: 'named',
    chunkIds: 'named'
  },

  plugins: [
    new DefinePlugin({
      'process.env.APP_VERSION': JSON.stringify(APP_VERSION),
      'process.env.APP_COMMIT': JSON.stringify(APP_COMMIT)
    })
  ]
});

module.exports = function (mode) {
  const themesDir = path.join(__dirname, '../scss/themes/chat');
  const themes = fs.readdirSync(themesDir);

  // Create entry points for themes
  const themeEntries = {};
  for (const theme of themes) {
    if (!theme.endsWith('.scss')) continue;
    const absPath = path.join(themesDir, theme);
    const themeName = theme.replace('.scss', '');
    themeEntries[`themes/${themeName}`] = absPath;
  }

  // Add fa.scss entry
  const faPath = path.join(themesDir, '../../fa.scss');
  themeEntries['fa'] = faPath;

  // Update rendererConfig entry
  rendererConfig.entry = {
    ...rendererConfig.entry,
    ...themeEntries
  };

  const cacheVersion = `${APP_VERSION}-${APP_COMMIT}`;
  const watchOptions = {
    ignored: ['**/node_modules/**', '**/.git/**'],
    aggregateTimeout: 300
  };
  for (const cfg of [
    mainConfig,
    preloadConfig,
    rendererConfig,
    storeWorkerEndpointConfig
  ]) {
    Object.assign(cfg, sharedConfig);
    cfg.watchOptions = watchOptions;
  }
  const sharedBuildDeps = [
    __filename,
    path.resolve(__dirname, '..', 'pnpm-lock.yaml'),
    path.resolve(__dirname, '..', 'tsconfig.json')
  ];

  mainConfig.cache = {
    type: 'filesystem',
    name: `main-${mode}`,
    version: cacheVersion,
    buildDependencies: {
      config: [...sharedBuildDeps, path.join(__dirname, 'tsconfig-main.json')]
    }
  };
  preloadConfig.cache = {
    type: 'filesystem',
    name: `preload-${mode}`,
    version: cacheVersion,
    buildDependencies: {
      config: [...sharedBuildDeps, path.join(__dirname, 'tsconfig-main.json')]
    }
  };
  rendererConfig.cache = {
    type: 'filesystem',
    name: `renderer-${mode}`,
    version: cacheVersion,
    buildDependencies: {
      config: [
        ...sharedBuildDeps,
        path.join(__dirname, 'tsconfig-renderer.json')
      ]
    }
  };
  storeWorkerEndpointConfig.cache = {
    type: 'filesystem',
    name: `store-worker-${mode}`,
    version: cacheVersion,
    buildDependencies: {
      config: [
        ...sharedBuildDeps,
        path.join(__dirname, 'tsconfig-renderer.json')
      ]
    }
  };

  if (mode === 'production') {
    process.env.NODE_ENV = 'production';

    mainConfig.devtool = false;
    preloadConfig.devtool = false;
    rendererConfig.devtool = false;
    storeWorkerEndpointConfig.devtool = false;

    const esbuildMinifier = new EsbuildPlugin({ target: 'es2022' });
    mainConfig.optimization.minimizer = [esbuildMinifier];
    preloadConfig.optimization.minimizer = [esbuildMinifier];
    storeWorkerEndpointConfig.optimization.minimizer = [esbuildMinifier];
    rendererConfig.optimization.minimizer = [
      esbuildMinifier,
      new CssMinimizerPlugin()
    ];
  } else {
    mainConfig.devtool = 'eval-source-map';
    preloadConfig.devtool = 'eval-source-map';
    rendererConfig.devtool = 'eval-source-map';
    storeWorkerEndpointConfig.devtool = 'eval-source-map';

    mainConfig.output.pathinfo = false;
    preloadConfig.output.pathinfo = false;
    rendererConfig.output.pathinfo = false;
    storeWorkerEndpointConfig.output.pathinfo = false;
  }

  return [storeWorkerEndpointConfig, mainConfig, preloadConfig, rendererConfig];
};
