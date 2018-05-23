var webpack = require('webpack'); 

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const path = require('path');

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css",
  disable: process.env.NODE_ENV === "development"
});

let RELEASE = false; // TODO: Select Release or not!

let plugs = [  
  new webpack.ProvidePlugin({
    $: "jquery",
    jQuery: "jquery"
  })
];
if(RELEASE) {
  plugs.push(new UglifyJsPlugin());
}

module.exports = {  
  entry: './src/app/app.ts',
  output: {
    filename: './dist/app.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
    alias: {
      modernizr$: path.resolve(__dirname, ".modernizrrc")
    }
  },
  plugins: plugs,
  module: {
    rules: [
      {
        test: /\.(png|jp(e*)g|svg)$/,  
        use: [{
            loader: 'url-loader',
            options: { 
                limit: 8000, // Convert images < 8kb to base64 strings
                name: 'images/[hash]-[name].[ext]'
            } 
        }]
      }
      ,{ test: /\.ts$/, loader: 'ts-loader' }
      ,{ 
        test: /\.modernizrrc$/,
        loader: "modernizr-loader!json-loader"
      },
      { test:/\.(s*)css$/, use:['style-loader','css-loader', 'sass-loader'] },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            //presets: ['@babel/preset-env']
          }
        }
      }    
    ]
  },
  externals: {
    'fs': true
  }
}