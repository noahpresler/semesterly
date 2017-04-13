//require our dependencies
var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

console.log("Running Webpack for " + process.env.NODE_ENV);

var config = {
    //the base directory (absolute path) for resolving the entry option
    context: __dirname,
    //the entry point we created earlier. Note that './' means
    //your current directory. You don't have to specify the extension  now,
    //because you will specify extensions later in the `resolve` section
    entry: './static/js/redux/init',

    output: {
        //where you want your compiled bundle to be stored
        path: path.resolve('./static/bundles/'),
        //naming convention webpack should use for your files
        filename: '[name]-[hash].js'
    },

    plugins: [
        //tells webpack where to store data about your bundles.
        new BundleTracker({filename: './webpack-stats.json'}),
        //makes jQuery available in every module
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
    ],

    module: {
        loaders: [
            //a regexp that tells webpack use the following loaders on all
            //.js and .jsx files
            {
                test: /\.jsx?$/,
                //we definitely don't want babel to transpile all the files in
                //node_modules. That would take a long time.
                exclude: /node_modules/,
                //use the babel loader
                loader: 'babel-loader',
                query: {
                    //specify that we will be dealing with React code
                    presets: ['react']
                }
            },
        ]
    },


    node: {
	  fs: "empty"
	},

    resolve: {
        //tells webpack where to look for modules
        modules: ['node_modules'],
        //extensions that should be used to resolve modules
        extensions: ['.jsx', '.js'],
    }
}

if (isDev) {
	// Tell django to use this URL to load packages and not use STATIC_URL + bundle_name
	config.output.publicPath = 'http://localhost:3000/assets/bundles/'; 
    config.plugins = config.plugins.concat(new webpack.HotModuleReplacementPlugin());
    config.plugins = config.plugins.concat(new webpack.NoEmitOnErrorsPlugin()); // don't reload if there is an error
    // config.module.loaders = [{
    //             test: /\.jsx$/,
    //             exclude: /node_modules/,
    //             loader: "eslint-loader",
    //         }].concat(config.module.loaders);
}

if (isProd) {
    // keeps hashes consistent between compilations
    config.plugins = config.plugins.concat(new webpack.optimize.OccurrenceOrderPlugin());

    // minifies your code
    config.plugins = config.plugins.concat(new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
    }));
}

module.exports = config;