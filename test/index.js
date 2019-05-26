import sinon from "sinon";
import test from "tape";
import sqnc from "sqnc";
import {Manager, observable, computed, reaction, updatable} from "../src/active-data";

function createTestData () {
	return {
		a: 1,
		b: 2,
		c: {
			c1: 3,
			c2: 4,
		},
		d: {
			d1: {
				d11: {
					d111: {
						d1111: 100,
					},
				},
			},
		},
		arr: [],
	};
}

test("Check methods exists", t => {
	observable({});
	computed({}, "comp", () => {});
	reaction(() => {});
	updatable(() => {});
	t.end();
});

test("Options", t => {
	const m = new Manager({testOpt: 5});
	t.equal(m.getOptions().testOpt, 5);
	m.setOptions({testOpt: "abc"});
	t.equal(m.getOptions().testOpt, "abc");
	const o = {x: 55};
	m.setOptions(o);
	t.equal(m.getOptions().testOpt, "abc");
	t.equal(m.getOptions().x, 55);
	o.x = 3;
	t.equal(m.getOptions().x, 55);
	t.end();
});

test("Create observable", t => {
	const m = new Manager();
	sinon.spy(m.$$.observables, "get");
	const plain = m.makeObservable("plain");
	t.equal(plain, "plain");
	const data = createTestData();
	t.notOk(m.isObservable(data.d.d1.d11.d111));
	const d = m.makeObservable(data);
	t.comment(
		"│    search for object in cache in case we already made observable for it"
	);
	t.equal(m.$$.observables.get.callCount, 1);
	const dsame = m.makeObservable(data);
	t.equals(d, dsame);
	m.$$.observables.get.restore();
	sinon.spy(m.$$.observables, "get");
	m.makeObservable(d);
	t.comment("│    dont search object in cache if it's already observable");
	t.equal(m.$$.observables.get.callCount, 0);
	m.$$.observables.get.restore();

	const d4 = m.makeObservable(null);
	t.equal(d4, null);
	t.ok(m.isObservable(d.d.d1.d11.d111));
	t.notOk(m.isObservable(d.arr.map));

	const obsSrc1 = {};
	t.equal(m.getDataSource(m.makeObservable(obsSrc1)), obsSrc1);
	const obsSrc2 = Object.create(obsSrc1);
	t.equal(m.getDataSource(m.makeObservable(obsSrc2)), obsSrc2);
	t.end();
});

test("Create computed property", t => {
	const m = new Manager({immediateReaction: true});
	const d = m.makeObservable(createTestData());
	Object.assign(d, {
		x: "x",
		y: "y",
	});
	m.makeComputed(d, "comp1", self => self.x + self.y);
	d.comp1;
	d.x = "x1";
	d.y = "y1";
	d.comp1;

	const comp2 = sinon.spy(() => d.arr.filter(i => !i));
	const comp3 = sinon.spy(() => d.arr.filter(i => !i));
	m.makeComputed(d, "comp2", comp2);
	m.makeComputed(d, "comp3", comp3);
	d.comp2;
	d.comp3;
	t.equal(comp2.callCount, 1);
	d.arr = d.arr.concat([true, false, false]);
	d.arr.push(true);
	d.comp2;
	t.equal(comp2.callCount, 2);
	d.arr.push(true);
	d.comp2;
	t.equal(comp2.callCount, 3);
	d.comp2;
	t.equal(comp2.callCount, 3);
	t.equal(d.comp2.length, 2);
	delete d.comp1;
	t.end();
});

test("Computed property lazyness", t => {
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	const comp = sinon.spy(self => self.a + self.b);
	m.makeComputed(d, "comp", comp);
	t.equal(comp.callCount, 0);
	d.comp;
	t.equal(comp.callCount, 1);
	d.comp;
	t.equal(comp.callCount, 1);
	d.a = 5;
	t.equal(comp.callCount, 1);
	d.comp;
	t.equal(comp.callCount, 2);
	t.end();
});

test("Create reaction function (no-unregister)", t => {
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	d.a = 7;
	d.z = {};
	d.z.x = 11;
	const reaction = sinon.spy(() => {
		d.a + d.b + d.a;
	});
	t.equal(m.$$.reactionsToUpdate.size, 0);
	const reactionFn = m.makeReaction(reaction);
	t.equal(m.$$.reactionsToUpdate.size, 1);
	t.equal(reaction.callCount, 0);
	m.run();
	t.equal(m.$$.reactionsToUpdate.size, 0);
	t.equal(reaction.callCount, 1);
	m.run();
	t.equal(m.$$.reactionsToUpdate.size, 0);
	t.equal(reaction.callCount, 1);
	d.a = 3;
	d.b = 2;
	t.equal(m.$$.reactionsToUpdate.size, 1);
	t.equal(reaction.callCount, 1);
	m.run();
	t.equal(m.$$.reactionsToUpdate.size, 0);
	t.equal(reaction.callCount, 2);

	d.a = 2;
	d.b = 7;
	t.equal(m.$$.reactionsToUpdate.size, 1);
	t.equal(reaction.callCount, 2);
	reactionFn.uninit();
	t.equal(m.$$.reactionsToUpdate.size, 0);
	m.run();
	t.equal(m.$$.reactionsToUpdate.size, 0);
	t.equal(reaction.callCount, 2);
	reactionFn();
	t.equal(reaction.callCount, 3);
	t.end();
});

test("Cross reference inside computed properties", t => {
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	m.makeComputed(d, "comp1", self => self.comp2);
	m.makeComputed(d, "comp2", self => self.comp1);
	let warnMessage;
	sinon.stub(console, "warn").callsFake(message => (warnMessage = message));
	try {
		const a = d.comp2;
		t.comment("│    returned value is undefined");
		t.equal(a, undefined);
		t.comment("│    correct warn message is printed");
		t.equal(
			warnMessage,
			`Detected cross reference inside computed properties! "undefined" will be returned to prevent infinite loop`
		);
	}
	finally {
		console.warn.restore();
	}
	t.end();
});

test("Changing observable inside computed property", t => {
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	m.makeComputed(d, "comp1", self => (self.a = 3));
	m.makeComputed(d, "comp2", self => (self.b = 2));
	t.comment("│    changing to the new value");
	t.doesNotThrow(() => d.comp1);
	t.comment("│    changing to the same value");
	t.doesNotThrow(() => d.comp2);
	t.end();
});

test("Changing observable inside reaction function - positive", t => {
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	t.comment("│    changing to the new value");
	m.makeReaction(() => (d.a = 3), false);
	t.doesNotThrow(() => m.run());
	t.comment("│    changing to the same value");
	m.makeReaction(() => (d.b = 2), false);
	t.doesNotThrow(() => m.run());
	t.equal(d.a, 3);
	t.equal(d.b, 2);
	t.end();
});

test("Changing observable inside reaction function - negative", t => {
	const m = new Manager({immediateReaction: false});
	const d = m.makeObservable(createTestData());
	t.comment("│    making loop inside reaction");
	m.makeReaction(() => (d.a = d.a + 2));
	t.comment("│    check infinite loop error");
	t.equal(d.a, 1);
	t.throws(() => m.run());
	t.comment("│    throws");
	t.end();
});

test("Autorun on data change", t => {
	t.timeoutAfter(3000);
	const m = new Manager();
	const d = m.makeObservable(createTestData());
	let runCount = 0;
	m.makeReaction(() => {
		d.a + d.b;
		if (runCount === 0) {
			t.comment(`│    check initial value`);
			t.ok(d.a + d.b === 3);
		}
		else {
			t.comment("│    check value after change");
			t.ok(d.a + d.b === 5);
		}
		runCount++;
	});
	m.setOptions({
		afterRun () {
			if (runCount >= 2) {
				t.end();
			}
		},
	});
	setTimeout(() => (d.a = 3), 100);
});

test("Immediate reaction option", t => {
	t.timeoutAfter(3000);
	const m = new Manager({immediateReaction: true});
	const d = m.makeObservable(createTestData());
	const reaction = sinon.spy(() => {
		d.a + d.b;
	});
	m.makeReaction(reaction, true);
	t.equal(reaction.callCount, 1);
	d.a = 12;
	t.equal(reaction.callCount, 2);
	m.run(() => {
		d.a = 13;
		d.b = 14;
	});
	t.equal(reaction.callCount, 3);
	m.setOptions({
		afterRun () {
			t.equal(reaction.callCount, 4);
			t.end();
		},
	});
	m.runDeferred(() => {
		d.a = 15;
		d.b = 16;
	});
	t.equal(reaction.callCount, 3);
});

test("Test disabled reaction", t => {
	const m = new Manager({immediateReaction: true, enabled: false});
	const d = m.makeObservable(createTestData());
	const reaction = sinon.spy(() => {
		d.a + d.b;
	});
	m.makeReaction(reaction);
	d.a = 3123;
	m.run();
	t.equal(reaction.callCount, 0);
	t.end();
});

test("Test disabled reaction - deferred", t => {
	t.timeoutAfter(3000);
	const m = new Manager({enabled: false});
	const d = m.makeObservable(createTestData());
	const reaction = sinon.spy(() => {
		d.a + d.b;
	});
	m.makeReaction(reaction);
	d.a = 3123;
	m.runDeferred();
	setTimeout(() => {
		t.equal(reaction.callCount, 0);
		t.end();
	}, 100);
});


test("Forked call stack and invalidation", t => {
	const m = new Manager({immediateReaction: true});
	const d = m.makeObservable(createTestData());
	const comp = sinon.spy(self => self.a + self.b);
	m.makeComputed(d, "comp", comp);
	const comp2 = sinon.spy(self => self.comp);
	const comp3 = sinon.spy(self => self.comp);
	m.makeComputed(d, "comp2", comp2);
	m.makeComputed(d, "comp3", comp3);
	const reaction1 = sinon.spy(() => d.comp2);
	const reaction2 = sinon.spy(() => d.comp2);
	m.makeReaction(reaction1);
	m.makeReaction(reaction2);
	t.equal(reaction1.callCount, 1);
	d.a = 5123;
	t.equal(reaction1.callCount, 2);
	t.equal(reaction2.callCount, reaction1.callCount);
	t.end();
});

test("Getters and setters", t => {
	const m = new Manager({immediateReaction: true});
	const s1 = {
		a: 1,
		b: "count",
		get test () {
			return `${this.b}: ${this.a}`;
		},
	};
	const o1 = m.makeObservable(s1);
	const reaction = sinon.spy(() => o1.test);
	m.makeReaction(reaction);
	t.equal(reaction.callCount, 1);
	o1.a = 5;
	t.equal(reaction.callCount, 2);
	o1.c = 212;
	t.equal(reaction.callCount, 2);
	o1.b = "mark";
	t.equal(reaction.callCount, 3);
	t.end();
});


test("Object watch", t => {
	const {observable, reaction} = new Manager({immediateReaction: true});
	const s1 = {
		a: 1,
		b: "count",
		c: {
			x: 1,
		},
	};
	const o1 = observable(s1);
	const reactionFn = sinon.spy(() => o1.$$watch);
	reaction(reactionFn);
	t.equal(reactionFn.callCount, 1);
	o1.a = 2;
	t.equal(reactionFn.callCount, 2);
	o1.a = 2;
	t.equal(reactionFn.callCount, 2);
	o1.c.x = 212;
	t.equal(reactionFn.callCount, 2);
	o1.b = "mark";
	t.equal(reactionFn.callCount, 3);
	delete o1.a;
	t.equal(reactionFn.callCount, 4);
	t.end();
});

test("Object watch deep", t => {
	const {observable, reaction} = new Manager({immediateReaction: true});
	const s1 = {
		a: 1,
		b: "count",
		c: {
			x: 1,
		},
	};
	const o1 = observable(s1);
	const reactionFn = sinon.spy(() => o1.$$watchDeep);
	reaction(reactionFn);
	t.equal(reactionFn.callCount, 1);
	o1.a = 2;
	t.equal(reactionFn.callCount, 2);
	o1.a = 2;
	t.equal(reactionFn.callCount, 2);
	o1.c.y = o1;
	t.equal(reactionFn.callCount, 3);
	o1.c.x = 212;
	t.equal(reactionFn.callCount, 4);
	o1.b = "mark";
	t.equal(reactionFn.callCount, 5);
	t.end();
});

test("mapProperties", t => {
	const {observable, reaction, mapProperties} = new Manager({immediateReaction: true});
	const a = observable({x: 5, y: {c: 3}, z: "sda"});
	const b = observable({z: "s212"});
	mapProperties(a, b, "x");
	t.equal(b.x, a.x);
	const reactionFn = sinon.spy(() => b.x);
	const reactionFn2 = sinon.spy(() => a.x);
	reaction(reactionFn);
	reaction(reactionFn2);
	t.equal(reactionFn.callCount, 1);
	t.equal(reactionFn2.callCount, 1);
	a.x = 1212;
	t.equal(reactionFn.callCount, 2);
	t.equal(reactionFn2.callCount, 2);
	a.y = 32321;
	t.equal(reactionFn.callCount, 2);
	t.equal(reactionFn2.callCount, 2);
	b.x = "heh";
	t.equal(reactionFn.callCount, 3);
	t.equal(reactionFn2.callCount, 3);
	t.end();
});

test("mapProperties all", t => {
	const {observable, reaction, mapProperties} = new Manager({immediateReaction: true});
	const a = observable({x: 5, y: {c: 3}, z: "sda"});
	const b = observable({t: "s212"});
	mapProperties(a, b);
	t.equal(b.x, a.x);
	// t.comment("!!!!! b fields" + JSON.stringify(Object.keys(b)));
	const reactionFn = sinon.spy(() => b.$$watch);
	const reactionFn2 = sinon.spy(() => a.$$watch);
	reaction(reactionFn);
	reaction(reactionFn2);
	t.equal(reactionFn.callCount, 1);
	t.equal(reactionFn2.callCount, 1);
	a.x = 1212;
	t.equal(reactionFn.callCount, 2);
	t.equal(reactionFn2.callCount, 2);
	a.y = 32321;
	t.equal(reactionFn.callCount, 3);
	t.equal(reactionFn2.callCount, 3);
	b.z = "heh";
	t.equal(reactionFn.callCount, 4);
	t.equal(reactionFn2.callCount, 4);
	b.t = "heh";
	t.equal(reactionFn.callCount, 5);
	t.equal(reactionFn2.callCount, 4);
	t.end();
});

test("Array methods", t => {
	const {observable, reaction} = new Manager({immediateReaction: true});
	const a = observable(sqnc(1, 10).toArray(10));
	const reactionFn = sinon.spy(() => a.map(i => `item${i}`));
	reaction(reactionFn);
	t.equal(reactionFn.callCount, 1);
	a.splice(2, 1);
	t.equal(reactionFn.callCount, 2);
	a.length = 3;
	t.equal(reactionFn.callCount, 3);
	a.length = 3;
	t.equal(a.join(","), "1,2,4");
	t.end();
});

test("timeLimit", t => {
	const manager = new Manager({immediateReaction: true, timeLimit: 0});
	const {observable, reaction} = manager;
	const a = observable({x: 1});
	const reactionFn = sinon.spy(() => a.x);
	reaction(reactionFn);
	t.equal(reactionFn.callCount, 1);
	a.x = 2;
	t.equal(reactionFn.callCount, 2);
	a.x = 2;
	t.equal(reactionFn.callCount, 2);
	t.end();
});

test("timeLimit perf_hooks.performance", async t => {
	global.performance = (await import("perf_hooks")).performance;
	const manager = new Manager({immediateReaction: true, timeLimit: 0});
	const {observable, reaction} = manager;
	const a = observable({x: 1});
	const reactionFn = sinon.spy(() => a.x);
	reaction(reactionFn);
	t.equal(reactionFn.callCount, 1);
	a.x = 2;
	t.equal(reactionFn.callCount, 2);
	a.x = 2;
	t.equal(reactionFn.callCount, 2);
	t.end();
});
