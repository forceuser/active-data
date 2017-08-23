/* global __dirname */
const path = require("path");
const webpack = require("webpack");

const common = {};

module.exports = [
	Object.assign({
		entry: [
			path.resolve(__dirname, "../test/run-test.js")
		],
		output: {
			path: path.resolve(__dirname, "../test/build"),
			filename: "test-runner-browser.js",
			publicPath: 'test/build/',
			library: "runTest",
			libraryTarget: "umd"
		},
		target: "web",
		node: {
			fs: "empty"
		},
		resolve: {
			alias: {
				"src": path.resolve(__dirname, "../src")
			}
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
							// ["es2015", {
							// 	modules: false
							// }]
						],
						plugins: [
							"syntax-dynamic-import"
						]
					}
				}]
			}]
		},
		plugins: [
			// new webpack.optimize.LimitChunkCountPlugin({
			// 	maxChunks: 1
			// })
		]
	}, common),
	Object.assign({
		entry: [
			path.resolve(__dirname, "../test/test-runner.js")
		],
		output: {
			path: path.resolve(__dirname, "../test/build"),
			filename: "test-runner-node.js"
		},
		target: "node",
		resolve: {
			alias: {
				"src": path.resolve(__dirname, "../src")
			}
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
							// ["es2015", {
							// 	modules: false
							// }]
						],
						plugins: [
							"syntax-dynamic-import",
							["istanbul", {
								"exclude": [
									"test/**/*"
								]
							}]
						]
					}
				}]
			}]
		},
		plugins: []
	}, common),

];
