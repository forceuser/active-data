/* global process */
/* global global */

import faucet from "faucet";
import globby from "globby";
import fs from "fs-promise";
import runTest from "./run-test";

async function run () {
	await fs.remove("./coverage");
	const files = (await globby(`./test/unit-tests/**/*.js`)).map(path => path.toString().replace("./test/unit-tests/", ""));
	const $faucet = faucet();
	let success = true;
	for (const fileName of files) {
		await new Promise(async (resolve) => {
			runTest({
				fileName,
				middleware: [$faucet],
				ondata: (data) => {
					process.stdout.write(data);
				},
				onend: (tape) => {
					if (tape._exitCode !== 0) {
						success = false;
					}
					resolve();
				},
			});
		});
	}
	if (!success) {
		process.exit(1);
	}
	console.log(`\n==== CODE COVERAGE ====\n`);
	await fs.mkdirs("./coverage");
	await fs.writeFile(`./coverage/coverage.json`, JSON.stringify(global.__coverage__ || {}), "utf-8");
}

run();
