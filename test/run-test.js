import {createHarness} from "tape";

export default async function ({fileName, middleware, ondata, onend}) {
	const runTest = (await import(`./unit-tests/${fileName}`)).default;
	const tape = createHarness();
	const stream = tape.createStream({autoclose: true});

	console.log(`\n==== RUN unit-tests: "${fileName}" ====\n`);

	(middleware || [])
	.reduce((res, i) => {
		res = res.pipe(i);
		return res;
	}, stream)
	.on("data", data => {
		ondata && ondata(data, tape);
	})
	.on("end", () => {
		onend && onend(tape);
	});
	runTest(tape);
}
