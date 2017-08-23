/* global process */
import Stream from "stream";
import {createHarness} from "tape";
import faucet from "faucet";
import runTest from "./index.js";

const tape = createHarness();
const stream = tape.createStream({autoclose: true});
stream.pipe(faucet()).pipe(process.stdout);
runTest(tape);
