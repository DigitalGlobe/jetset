const path = require( 'path' );

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
  modules: { rules },
  output: {
    path: __dirname + '/public',
    filename: '[name].js'
  },
  devServer: {
    contentBase: __dirname + '/public'
  }
};

module.exports = devBuild;
