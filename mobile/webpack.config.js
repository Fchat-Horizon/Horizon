const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const { Stream } = require("stream");
const { node } = require("webpack");
const vueTransformer = require("@f-list/vue-ts/transform").default;
const nodepolyfillplugin = require("node-polyfill-webpack-plugin");

const config = {
  entry: {
    chat: [__dirname + "/chat.ts", __dirname + "/index.html"],
  },
  output: {
    path: __dirname + "/www",
    filename: "[name].js",
  },
  context: __dirname,
  externals: {
    request: 'null',
    'request-promise-native': 'null',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
          configFile: __dirname + "/tsconfig.json",
          transpileOnly: true,
          getCustomTransformers: () => ({ before: [vueTransformer] }),
        },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          compilerOptions: {
            preserveWhitespace: false,
          },
        },
      },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
      { test: /\.(woff2?)$/, loader: "file-loader" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
      {
        test: /\.(wav|mp3|ogg)$/,
        loader: "file-loader",
        options: { name: "sounds/[name].[ext]" },
      },
      {
        test: /\.(png|html)$/,
        loader: "file-loader",
        options: { name: "[name].[ext]" },
      },
      { test: /(?<!\.vue)\.scss/, use: ["to-string-loader", "css-loader", "sass-loader"] },
      {
        test: /\.vue\.scss/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
      { test: /\.vue\.css/, use: ["vue-style-loader", "css-loader"] },
    ],
  },
  plugins: [
    // Type checking disabled for mobile build - vue-template-compiler version mismatch
    // new ForkTsCheckerWebpackPlugin({
    //   async: false,
    //   typescript: {
    //     configFile: path.join(__dirname, "tsconfig.json"),
    //   },
    // }),
    new VueLoaderPlugin(),
    new (require('webpack').DefinePlugin)({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new (require('webpack').ProvidePlugin)({
      process: require.resolve('./process-shim.js'),
    }),
  ],
  resolve: {
    alias: {
      electron: require.resolve('./electron-shim.js'),
      'request-promise': require.resolve('./request-promise-shim.js'),
      '../learn/store/worker': require.resolve('./worker-store-shim.js'),
      '../helpers/dialog': require.resolve('./dialog-shim.js'),
    },
    fallback: {
      fs: require.resolve('./fs-shim.js'),
      path: require.resolve('./path-shim.js'),
      os: require.resolve('./os-shim.js'),
      tls: false,
      net: false,
    },
    extensions: [".ts", ".js", ".vue", ".scss"],
  },
};

config.plugins.push(new nodepolyfillplugin({
  excludeAliases: ['os', 'electron'] // Use our custom shims instead
}));

module.exports = function (mode) {
  if (mode === "production") {
    process.env.NODE_ENV = "production";
    config.devtool = "source-map";
  } else {
    config.devtool = false;
  }
  return config;
};
