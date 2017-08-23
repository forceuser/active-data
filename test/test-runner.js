/* global process */
/* global global */

import faucet from "faucet";
import globby from "globby";
import fs from "fs-promise";
import runTest from "./run-test";

async function run () {
	const files = (await globby(`./test/unit-tests/**/*.js`)).map(path => path.toString().replace("./test/unit-tests/", ""));
	let success = true;
	for (const fileName of files) {
		await new Promise(async (resolve) => {
			runTest({
				fileName,
				middleware: [faucet()],
				ondata: (data) => {
					process.stdout.write(data);
				},
				onend: (tape) => {
					resolve();
					if (tape._exitCode !== 0) {
						success = false;
					}
				}
			});
		});
	}
	if (!success) {
		process.exit(1);
	}

	await fs.remove("./coverage");
	await fs.mkdirs("./coverage");
	await fs.writeFile(`./coverage/coverage.json`, JSON.stringify(global.__coverage__ || {}), "utf-8");
}

run();
