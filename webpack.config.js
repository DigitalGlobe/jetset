const path = require( 'path' );
const webpack = require( 'webpack' );

const plugins = [ new webpack.EnvironmentPlugin( 'NODE_ENV' ) ];

const rules = [{
  test: /\.js$/,
  include: path.join( __dirname, 'src' ),
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: { cacheDirectory: true } 
  }
}];

const devBuild = {
  entry: { example: path.join( __dirname, 'src', 'examples', 'index.js' ) },
  module: { rules },
  plugins,
  output: {
    path: __dirname + '/public',
    filename: '[name].js'
  },
  devServer: {
    contentBase: __dirname + '/public',
    historyApiFallback: {
      index: 'index.html'
    }
  }
};

module.exports = devBuild;
