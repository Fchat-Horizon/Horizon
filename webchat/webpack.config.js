const path = require('path');
const ForkTsCheckerWebpackPlugin = require('@f-list/fork-ts-checker-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const vueTransformer = require('@f-list/vue-ts/transform').default;

const config = {
  entry: __dirname + '/chat.ts',
  output: {
    path: __dirname + '/dist'
  },
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          configFile: __dirname + '/tsconfig.json',
          transpileOnly: true,
          getCustomTransformers: () => ({ before: [vueTransformer] })
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            preserveWhitespace: false
          }
        }
      },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
      { test: /\.(woff2?)$/, loader: 'file-loader' },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
      { test: /\.(wav|mp3|ogg)$/, loader: 'file-loader?name=sounds/[name].[ext]' },
      { test: /\.(png|html)$/, loader: 'file-loader?name=[name].[ext]' },
      { test: /\.scss$/, use: ['vue-style-loader', 'css-loader', 'sass-loader'] },
      { test: /\.css$/, use: ['vue-style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ async: false, vue: true, tslint: path.join(__dirname, '../tslint.json') }),
    new VueLoaderPlugin()
  ],
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.scss']
  }
};

module.exports = function (mode) {
  if (mode === 'production') {
    process.env.NODE_ENV = 'production';
    config.devtool = 'source-map';
  } else {
    config.devtool = 'none';
  }
  return config;
};
