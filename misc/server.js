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

const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const config = require("../webpack.config");

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  disableHostCheck: true, // This is needed for SSL reverse proxy in development environment
  hot: true,
  inline: true,
  watchOptions: {
    aggregateTimeout: 500,
    poll: 1000,
  },
  historyApiFallback: true,
// eslint-disable-next-line no-unused-vars
}).listen(3000, "0.0.0.0", (err, result) => {
  if (err) {
    console.log(err);
  }

  console.log("Listening at 0.0.0.0:3000");
});
