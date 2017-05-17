export class Manager {
	constructor () {
		this.isObservableSymbol = Symbol("isObservable");
		this.observables = new WeakMap();
		this.cache = new WeakMap();
		this.callStack = [];
		this.autorun = [];
	}
	makeObservable (dataSource) {
		if (!dataSource) {
			return dataSource;
		}
		if (this.isObservable(dataSource)) {
			return dataSource;
		}
		let observable = this.observables.get(dataSource);
		if (!observable) {
			const toUpdate = new Map();
			observable = new Proxy(dataSource, {
				get: (obj, key) => {
					if (key === this.isObservableSymbol) {
						return true;
					}

					if (this.callStack.length) {
						const callStack = [...this.callStack];
						const context = callStack[callStack.length - 1];
						if (!context.keys.includes(key)) {
							context.keys.push(key);
							let callStacks = toUpdate.get(key);
							if (!callStacks) {
								callStacks = [];
								toUpdate.set(key, callStacks);
							}
							callStacks.push(callStack);
						}
					}

					const val = obj[key];
					if (val === Object(val)) {
						return this.observable(val);
					}
					return val;
				},
				set: (obj, key, val, receiver) => {
					if (this.callStack && this.callStack.length) {
						throw new Error("Changing observable objects is restricted inside computed properties and autorun functions!");
					}


					if (val !== obj[key]) {
						obj[key] = val;
						const callStacks = toUpdate.get(key);

						if (callStacks) {
							callStacks.forEach((callStack) => {
								callStack.reverse().some(({obj, call}) => {
									const cacheByObject = this.cache.get(obj);
									let record;
									if (cacheByObject) {
										record = cacheByObject.get(call);
									}

									if (!record || !record.valid) {
										return true;
									}
									else {
										record.valid = false;
									}
								});
							});
						}

						toUpdate.delete(key);
						this.runDeferred();
					}
					return true;
				}
			});
			this.observables.set(dataSource, observable);
		}
		return observable;
	}
	makeUpdatable (obj, call) {
		const manager = this;
		return function () {
			let cacheByObject = manager.cache.get(obj);
			let record;
			if (cacheByObject) {
				record = cacheByObject.get(call);
			}
			else {
				cacheByObject = new Map();
				manager.cache.set(obj, cacheByObject);
			}

			if (!record) {
				record = {valid: false, value: undefined};
				cacheByObject.set(call, record);
			}
			if (record.computing) {
				console.warn("Detected cross reference inside computed properties! undefined will be returned to prevent infinite loop");
				return undefined;
			}

			if (record.valid) {
				return record.value;
			}
			record.computing = true;
			manager.callStack.push({obj, call, keys: []});
			try {
				let context;
				if (this) {
					const observable = manager.observables.get(this);
					context = observable ? observable : this;
				}
				else {
					context = manager;
				}

				const value = call.call(context, context);
				record.valid = true;
				record.value = value;
				return value;
			}
			finally {
				record.computing = false;
				manager.callStack.pop();
			}
		};
	}
	makeComputed (obj, key, call) {
		Object.defineProperty(obj, key, {
			enumerable: true,
			get: this.makeUpdatable(obj, call, obj)
		});
		return obj;
	}
	makeAutorun (call, runDeferred = true) {
		const manager = this;
		const updatable = this.makeUpdatable(this, call);
		manager.autorun.push(updatable);
		if (runDeferred) {
			manager.runDeferred();
		}
		return function unregister () {
			const idx = manager.autorun.indexOf(updatable);
			if (idx >= 0) {
				manager.autorun.splice(idx, 1);
			}
		};
	}
	isObservable (obj) {
		return obj[this.isObservableSymbol] === true;
	}
	run (action) {
		if (typeof action === "function") {
			action();
		}
		this.runScheduled = false;
		this.autorun.forEach(updatable => updatable());
		typeof this.onAfterRun === "function" && this.onAfterRun();
	}
	runDeferred (action) {
		if (!this.runScheduled) {
			this.runScheduled = setTimeout(() => this.run());
			if (typeof action === "function") {
				action();
			}
		}
	}
}

Manager.default = new Manager();

export default Manager.default;
