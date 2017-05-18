#!/usr/bin/env node

const publishRelease = require("publish-release");
const semver = require("semver");
const shell = require("shelljs");
const globby = require('globby');

const fs = require("fs");

if (
	shell.exec("npm test").code === 0 &&
	shell.exec("npm run build").code === 0
) {
	console.log("tested and builded");
	pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
	const oldVersion = pkg.version;
	pkg.version = semver.inc(pkg.version, "patch");
	fs.writeFileSync("./package.json", `${JSON.stringify(pkg, null, "\t")}\n`, 'utf8');

	function restoreVersion() {
		pkg.version = oldVersion;
		fs.writeFileSync("./package.json", `${JSON.stringify(pkg, null, "\t")}\n`, 'utf8');
	}
	try {
		const repoInfo = pkg.repository.url.match(/github.com\/([^/]*)\/([^/]*).git/);
		console.log(repoInfo);
		publishRelease({
			token: process.env.GIT_RELEASE_TOKEN,
			repo: repoInfo[2],
			owner: repoInfo[1],
			tag: `${pkg.version}`,
			name: `${pkg.name} v${pkg.version}`,
			assets: globby.sync("build/**/*")
		}, (error, release) => {
			console.log("release error", error);
			console.log("release", release);
			if (error) {
				restoreVersion();
				process.exit(1);
			}
		});
	} catch (error) {
		restoreVersion();
		process.exit(1);
	}
}
