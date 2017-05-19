/**
 * Менеджер для
 *
 * @example
 */
export class Manager {
	/**
	* @constructor
	*
	* @param {Object} [options]
	*/
	constructor (options) {
		this.isObservableSymbol = Symbol("isObservable");
		this.observables = new WeakMap();
		this.cache = new WeakMap();
		this.options = {immediateAutorun: false};
		this.callStack = [];
		this.autorun = [];
		this.setOptions(options);
	}
	setOptions (options = {}) {
		this.options = Object.assign(this.options, options);
	}
	/**
	* Оборачивет источник данных и возвращает объект доступ к свойствам которого будет остлеживатся
	* Все дочерние объекты и массивы также будут оборачиватся при доступе к ним
	* @param {(Object|Array)} dataSource источник данных
	* @return {Observale} отслеживаемый объект
	*/
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
						return this.makeObservable(val);
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
									const record = this.cache.get(obj).get(call);
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
						if (!this.inRunSection) {
							if (this.options.immediateAutorun) {
								this.run();
							}
							else {
								this.runDeferred();
							}
						}
					}
					return true;
				}
			});
			this.observables.set(dataSource, observable);
		}
		return observable;
	}
	/**
	* Создает функцию
	* @param {Observable} obj
	* @param {Function} call
	*/
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
					context = manager.observables.get(this);
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
	/**
	* Создает функцию
	* @param {Observable} obj
	* @param {String} key
	* @param {Function} call
	*/
	makeComputed (obj, key, call) {
		Object.defineProperty(obj, key, {
			enumerable: true,
			get: this.makeUpdatable(obj, call, obj)
		});
		return obj;
	}
	/**
	* Создает функцию автозапускаемую при изменении используемых в ней данных
	* @param {Function} call
	* @param {Boolean} run
	*/
	makeAutorun (call, run = true) {
		const manager = this;
		const updatable = this.makeUpdatable(this, call);
		manager.autorun.push(updatable);
		if (run) {
			if (this.options.immediateAutorun) {
				manager.run();
			}
			else {
				manager.runDeferred();
			}
		}
		return function unregister () {
			const idx = manager.autorun.indexOf(updatable);
			if (idx >= 0) {
				manager.autorun.splice(idx, 1);
			}
		};
	}
	/**
	* Проверяет является ли объект наблюдаемым
	* @param {(Observable|Object|Array)} obj
	*/
	isObservable (obj) {
		return obj[this.isObservableSymbol] === true;
	}
	/**
	* Запускает все автозапускаемые функции которые помечены как невалидные
	* @param {Function} [action] Действия выполняемые внутри вызова этой функции не будут вызывать неотложный запуск автозапускаемых функций
	*/
	run (action) {
		this.inRunSection = true;
		try {
			if (typeof action === "function") {
				action();
			}
			this.runScheduled = false;
			this.autorun.forEach(updatable => updatable());
			typeof this.onAfterRun === "function" && this.onAfterRun();
		}
		finally {
			this.inRunSection = false;
		}
	}
	/**
	* Запускает все автозапускаемые функции которые помечены как невалидные
	* В отличии от run запускает их не сразу а по таймауту
	* @param {Function} [action] Действия выполняемые внутри вызова этой функции не будут вызывать неотложный запуск автозапускаемых функций
	* @param {number} [timeout=0] Действия выполняемые внутри вызова этой функции не будут вызывать неотложный запуск автозапускаемых функций
	*/
	runDeferred (action, timeout = 0) {
		this.inRunSection = true;
		try {
			if (!this.runScheduled) {
				this.runScheduled = setTimeout(() => this.run(), timeout);
			}
			if (typeof action === "function") {
				action();
			}
		}
		finally {
			this.inRunSection = false;
		}
	}
}

/**
* Экспортируемый по умолчанию экземпляр Manager
* @instance
*/
Manager.default = new Manager();
Manager.default.Manager = Manager;

export default Manager.default;
