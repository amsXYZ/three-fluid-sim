const merge = require("webpack-merge");
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const commonConfig = require("./common.config");

const config = merge(commonConfig, {
  mode: "development",
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      }
    ]
  },
  devtool: "source-map",
  devServer: {
    contentBase: "./dist"
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, "../src/resources"),
        to: "resources",
        toType: "dir"
      }
    ]),
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ]
});

module.exports = config;
