/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

// require our dependencies
const path = require("path");
const webpack = require("webpack");
const BundleTracker = require("webpack-bundle-tracker");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

console.log(`Running Webpack for ${process.env.NODE_ENV}`);

const config = {
  // the base directory (absolute path) for resolving the entry option
  context: __dirname,
  // the entry point we created earlier. Note that './' means
  // your current directory. You don't have to specify the extension  now,
  // because you will specify extensions later in the `resolve` section
  entry: ["./static/js/redux/init", "./static/css/timetable/main"],

  output: {
    // where you want your compiled bundle to be stored
    path: path.resolve("./static/bundles/"),
    // naming convention webpack should use for your files
    filename: "[name]-[hash].js",
  },

  plugins: [
    // tells webpack where to store data about your bundles.
    new BundleTracker({ filename: "./webpack-stats.json" }),
    // makes jQuery available in every module
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
    }),
    new ExtractTextPlugin({
      filename: "style-[hash].css",
      allChunks: true,
    }),
  ],

  devtool: "source-map",

  module: {
    loaders: [
      // a regexp that tells webpack use the following loaders on all
      // .js and .jsx files
      {
        test: /\.jsx?$/,
        // we definitely don't want babel to transpile all the files in
        // node_modules. That would take a long time.
        exclude: /node_modules/,
        // use the babel loader
        loader: "babel-loader",
        query: {
          // specify that we will be dealing with React code
          presets: ["react"],
        },
      },
      {
        // add loader option to bundle and transpile typescript
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: { onlyCompileBundledFiles: true },
          },
        ],
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                minimize: isProd,
                sourceMap: isDev,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                minimize: isProd,
                sourceMap: isDev,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: isDev,
              },
            },
          ],
        }),
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: "url-loader",
      },
    ],
  },

  node: {
    fs: "empty",
  },

  resolve: {
    // tells webpack where to look for modules
    modules: ["node_modules"],
    // extensions that should be used to resolve modules
    extensions: [".jsx", ".js", ".ts", ".tsx", ".scss", ".css"],
  },
};

if (isDev) {
  // Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
  config.output.publicPath = "http://localhost:3000/assets/bundles/";
  config.plugins = config.plugins.concat(new webpack.HotModuleReplacementPlugin());
  // don't reload if there is an error
  config.plugins = config.plugins.concat(new webpack.NoEmitOnErrorsPlugin());
  // config.module.loaders = [{
  //             __tests__: /\.jsx$/,
  //             exclude: /node_modules/,
  //             loader: "eslint-loader",
  //         }].concat(config.module.loaders);
}

if (isProd) {
  // keeps hashes consistent between compilations
  config.plugins = config.plugins.concat(new webpack.optimize.OccurrenceOrderPlugin());

  // minifies your code
  config.plugins = config.plugins.concat(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    })
  );
}

module.exports = config;
