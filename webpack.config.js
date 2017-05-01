const path = require( 'path' );

module.exports = {
  module: {
    rules: [{
      test: /\.js$/,
      include: path.join( __dirname, 'src' ),
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: { cacheDirectory: true } 
      }
    }]
  },
  entry: { example: path.join( __dirname, 'src', 'examples', 'index.js' ) },
  output: {
    path: __dirname + '/public',
    filename: '[name].js'
  },
  devServer: {
    contentBase: __dirname + '/public'
  }
};
