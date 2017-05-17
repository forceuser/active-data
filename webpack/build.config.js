/* global __dirname */
const path = require("path");
const webpack = require("webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
	entry: [
		path.resolve(__dirname, "../index.js")
	],
	output: {
		path: path.resolve(__dirname, "../build"),
		filename: "index.js"
	},
	devtool: "source-map",
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules)/,
			use: [{
				loader: "babel-loader",
				options: {
					presets: [
						["es2015", {
							modules: false
						}]
					],
					plugins: []
				}
			}]
		}]
	},
	plugins: [
		new UglifyJSPlugin({
			sourceMap: true,
			compress: {
				warnings: false,
				keep_fnames: true
			},
			mangle: {
				keep_fnames: true
			}
		})
	]
};
