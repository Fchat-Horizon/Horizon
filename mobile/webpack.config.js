const path = require("path");
const ForkTsCheckerWebpackPlugin = require("@f-list/fork-ts-checker-webpack-plugin");
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
      { test: /(?<!\.vue)\.scss/, use: ["css-loader", "sass-loader"] },
      {
        test: /\.vue\.scss/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
      { test: /\.vue\.css/, use: ["vue-style-loader", "css-loader"] },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: false,
      vue: true,
      tslint: path.join(__dirname, "../tslint.json"),
    }),
    new VueLoaderPlugin(),
  ],
  resolve: {
    fallback: {
      fs: false,
      tls: false,
      net: false,
    },
    extensions: [".ts", ".js", ".vue", ".scss"],
  },
};

config.plugins.push(new nodepolyfillplugin());

module.exports = function (mode) {
  resolve: {
    alias: {
      vue: '@vue/compat'
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            compatConfig: {
              MODE: 2
            }
          }
        }
      }
    ]
  }
  if (mode === "production") {
    process.env.NODE_ENV = "production";
    config.devtool = "source-map";
  } else {
    config.devtool = false;
  }
  return config;
};
