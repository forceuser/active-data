/* global process */

const privateMap = new WeakMap();
const initPrivate = target => privateMap.set(target, {});
const $ = target => privateMap.get(target);

/**
 * Reactive data manager that observes data changes and performs actions in response.
 * Observation is lazy, data is updated only when required.
 *
 * @param {ManagerOptions} [options] Manager options
 */
export class Manager {
	constructor (options) {
		const manager = this;
		initPrivate(manager);
		const $$ = $(manager);
		$$.intentToRun = 0;
		$$.dataSourceKey = Symbol("dataSource");
		$$.observables = new WeakMap();
		$$.options = {
			enabled: true,
			immediateReaction: false,
			maxIterations: 10,
			watchKey: "$$watch",
			watchDeepKey: "$$watchDeep",
			afterRun: null,
		};
		$$.callStack = [];
		$$.reactionsToUpdate = new Set();

		manager.setOptions(options);
		manager.makeObservable = manager.makeObservable.bind(manager);
		manager.makeReaction = manager.makeReaction.bind(manager);
		manager.makeComputed = manager.makeComputed.bind(manager);
		manager.makeUpdatable = manager.makeUpdatable.bind(manager);
		manager.mapProperties = manager.mapProperties.bind(manager);

		manager.isObservable = manager.isObservable.bind(manager);
		manager.getDataSource = manager.getDataSource.bind(manager);
		// aliases
		manager.observable = manager.makeObservable;
		manager.reaction = manager.makeReaction;
		manager.computed = manager.makeComputed;
		manager.updatable = manager.makeUpdatable;
		/* istanbul ignore next */
		if (process && process.env.NODE_ENV === "test") {
			manager.$$ = $$;
		}
	}

	/**
	 * Maps properties from `source` to `target`
	 *
	 * @param {Observable} source
	 * @param {Observable} target
	 * @param {(Array|String)} [propertyKeys] property keys of `source` object to map to `target` object, if not set then all keys will be mapped
	 */
	mapProperties (source, target, propertyKeys) {
		[].concat(propertyKeys || Object.keys(source)).forEach(propertyKey => {
			Object.defineProperty(target, propertyKey, {
				enumerable: true,
				get () {
					return Reflect.get(source, propertyKey, this);
				},
				set (value) {
					return Reflect.set(source, propertyKey, value, this);
				},
			});
		});
	}

	/**
	 * Dynamically sets the options of the data manager
	 *
	 * @param {ManagerOptions} [options] Manager options
	 */
	setOptions (options = {}) {
		$(this).options = Object.assign($(this).options, options);
	}

	/**
	 * Gets the options of the data manager
	 *
	 * @return {ManagerOptions} Manager options
	 */
	getOptions () {
		return Object.assign({}, $(this).options);
	}

	/**
	 * Creates {@link Observable} object for the specified dataSource
	 *
	 * @param {(Object|Array)} dataSource data source
	 * @return {Observable} observable object
	 */
	makeObservable (dataSource) {
		const manager = this;
		const $$ = $(manager);
		if (!dataSource) {
			return dataSource;
		}
		if (
			dataSource.constructor !== Object &&
			dataSource.constructor !== Array
		) {
			return dataSource;
		}

		if (manager.isObservable(dataSource)) {
			return dataSource;
		}
		let observable = $$.observables.get(dataSource);
		if (!observable) {
			const toUpdate = new Map();

			const invalidateDeps = updatableState => {
				updatableState.invalidIteration = true;
				updatableState.onInvalidate && updatableState.onInvalidate();
				if (updatableState.valid) {
					updatableState.valid = false;
					updatableState.deps.forEach(updatableState =>
						invalidateDeps(updatableState)
					);
				}
				updatableState.deps.clear();
			};

			const initUpdates = propertyKey => {
				const updatableStates = new Set();
				toUpdate.set(propertyKey, updatableStates);
				return updatableStates;
			};
			let watchDeepSection = false;
			const registerRead = (updatableState, propertyKey) => {
				const currentKey = propertyKey === $$.options.watchDeepKey ? $$.options.watchKey : propertyKey;
				if (propertyKey === $$.options.watchDeepKey) {
					if (watchDeepSection) {
						return;
					}
					watchDeepSection = true;
					Object.keys(dataSource).forEach(key => {
						if (typeof dataSource[key] === "object") {
							const obs = manager.makeObservable(dataSource[key]);
							obs[$$.options.watchDeepKey];
						}
					});
					watchDeepSection = false;
				}
				if (currentKey === $$.options.watchKey) {
					Object.keys(dataSource).forEach(key => {
						const propertyDescriptor = Object.getOwnPropertyDescriptor(dataSource, key);
						if (propertyDescriptor && typeof propertyDescriptor.get === "function") {
							manager
								.makeUpdatable(propertyDescriptor.get)
								.call(observable);
						}
					});
				}

				const updatableStates = toUpdate.get(currentKey) || initUpdates(currentKey);
				if (!updatableStates.has(updatableState)) {
					updatableStates.add(updatableState);
					updatableState.uninitMap.set(dataSource, updatableState => {
						updatableStates.delete(updatableState);
						if (updatableStates.size === 0) {
							toUpdate.delete(currentKey);
						}
					});
				}
			};

			const ctrl = {toUpdate, dataSource, registerRead};

			const updateProperty = propertyKey => {
				const invalidatorFn = updatableState => invalidateDeps(updatableState);

				const updatableStates = ctrl.toUpdate.get(propertyKey);
				const updatableStatesWatch = ctrl.toUpdate.get($$.options.watchKey);

				updatableStates && updatableStates.forEach(invalidatorFn);
				updatableStatesWatch && updatableStatesWatch.forEach(invalidatorFn);

				if (!$$.inRunSection && $$.intentToRun === 1) {
					if ($$.options.immediateReaction) {
						manager.run();
					}
					else {
						manager.runDeferred();
					}
				}
			};

			observable = new Proxy(dataSource, {
				get: (target, propertyKey, context) => {
					const $$ = $(manager);
					if (propertyKey === $$.dataSourceKey) {
						return dataSource;
					}

					const propertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);

					if (
						propertyDescriptor &&
						typeof propertyDescriptor.get === "function"
					) {
						return manager
							.makeUpdatable(propertyDescriptor.get)
							.call(target);
					}

					if ($$.callStack.length) {
						registerRead(
							$$.callStack[$$.callStack.length - 1],
							propertyKey
						);
					}

					if (
						propertyKey === $$.options.watchKey ||
						propertyKey === $$.options.watchDeepKey
					) {
						return context;
					}

					const value = Reflect.get(target, propertyKey, context);
					if (typeof value === "object" && propertyDescriptor && propertyDescriptor.enumerable) {
						return manager.makeObservable(value);
					}
					return value;
				},
				set: (target, propertyKey, value, context) => {

					const oldValue = Reflect.get(target, propertyKey, context);
					if (
						value !== oldValue ||
						(Array.isArray(target) && propertyKey === "length")
					) {
						$$.intentToRun++;
						try {
							Reflect.set(target, propertyKey, value, context);
							updateProperty(propertyKey);
						}
						finally {
							$$.intentToRun--;
						}
					}
					return true;
				},
				deleteProperty: (target, propertyKey) => {
					$$.intentToRun++;
					try {
						updateProperty(propertyKey);
					}
					finally {
						$$.intentToRun--;
					}
					return true;
				},
			});
			$$.observables.set(dataSource, observable);
		}
		return observable;
	}

	/**
	 * Creates {@link UpdatableFunction}
	 * Used for internal purposes
	 *
	 * @param {Function} fn function that will be called from {@link UpdatableFunction}
	 * @param {UpdatableSettings} settings settings for updatable function
	 * @return {UpdatableFunction}
	 */
	makeUpdatable (fn, settings = {}) {
		if (fn.originalFn) {
			return fn;
		}
		const onInvalidate = settings.onInvalidate;
		const onUninit = settings.onUninit;

		const manager = this;
		const $$ = $(manager);

		const updatableState = {
			active: true,
			valid: false,
			onInvalidate,
			onUninit,
			value: undefined,
			deps: new Set(),
			uninitMap: new Map(),
			uninit: () => {
				[...updatableState.uninitMap.values()].forEach(uninitCall => uninitCall(updatableState));
				updatableState.uninitMap.clear();
			},
		};

		const updatableFunction = function () {
			if (!updatableState.active) {
				return fn.call(this, this);
			}
			if (updatableState.computing) {
				console.warn(
					`Detected cross reference inside computed properties!` +
						` "undefined" will be returned to prevent infinite loop`
				);
				return undefined;
			}
			if ($$.callStack.length) {
				updatableState.deps.add(
					$$.callStack[$$.callStack.length - 1]
				);
			}

			if (updatableState.valid) {
				return updatableState.value;
			}
			updatableState.computing = true;
			updatableState.uninit();

			$$.callStack.push(updatableState);
			try {
				const context = this ? $$.observables.get(this) || this : null;
				updatableState.invalidIteration = false;
				const value = fn.call(context, context);

				updatableState.valid = !updatableState.invalidIteration; // check if it was invalidated inside call
				updatableState.value = value;
				return value;
			}
			finally {
				updatableState.computing = false;
				$$.callStack.pop();
			}
		};
		updatableFunction.uninit = () => {
			updatableState.uninit();
			updatableState.active = false;
			onUninit && onUninit();
		};
		updatableFunction.originalFn = fn;
		return updatableFunction;
	}

	/**
	 * Creates computed property
	 *
	 * @param {Object} target The object for which the calculated property will be created
	 * @param {String} propertyKey Name of calculated property
	 * @param {Function} getter The function to be executed when accessing the property
	 * @param {Function} [setter] The function that will be executed when setting the value of the property
	 */
	makeComputed (target, propertyKey, getter, setter) {
		Object.defineProperty(target, propertyKey, {
			enumerable: true,
			get: this.makeUpdatable(getter),
			set: setter,
		});
	}

	/**
	 * Creates {@link UpdatableFunction} that will be automatically
	 * executed when one of it's dependencies are changed
	 *
	 * @param {Function} call
	 * Function to call {@link UpdatableFunction}
	 * 'call' will be executed when some of {@link Observable} that was used on previous call
	 * are changed
	 *
	 * @param {Boolean} run
	 * Run function immediately after it's registration
	 * If {@link ManagerOptions.immediateReaction} is not set
	 * then it will be called on the next tick.
	 * @return {UpdatableFunction}
	 */
	makeReaction (call, run = true) {
		const manager = this;
		const $$ = $(manager);
		const updatable = manager.makeUpdatable(call, {
			onInvalidate: () => $$.reactionsToUpdate.add(updatable),
			onUninit: () => $$.reactionsToUpdate.delete(updatable),
		});
		$$.reactionsToUpdate.add(updatable);
		if (run) {
			if ($$.options.immediateReaction) {
				manager.run();
			}
			else {
				manager.runDeferred();
			}
		}
		return updatable;
	}

	/**
	 * Returns original source of {@link Observable}
	 *
	 * @return {(Object|Array)}
	 */
	getDataSource (target) {
		return target[$(this).dataSourceKey];
	}

	/**
	 * Checks if the object is {@link Observable}
	 *
	 * @param {(Observable|Object|Array)} target
	 */
	isObservable (target) {
		return target[$(this).dataSourceKey] != null;
	}

	/**
	 * Executes all reactions that marked with invalid state
	 *
	 * @param {Function} [action]
	 * Changes of {@link Observable} that happens inside 'action' function
	 * will not trigger immediate execution of dependent reactions
	 * If {@link ManagerOptions.immediateReaction} is set then reactions
	 * will be executed after exiting the 'action' function
	 */
	run (action) {
		const manager = this;
		const $$ = $(manager);
		if (!$$.options.enabled) {
			return;
		}
		$$.inRunSection = true;
		try {
			if (typeof action === "function") {
				action();
			}
			$$.runScheduled = false;
			let iterations = 0;
			while ($$.reactionsToUpdate.size) {
				if (iterations > $$.options.maxIterations) {
					$$.reactionsToUpdate.clear();
					throw new Error("Max iterations exceeded!");
				}
				iterations++;
				[...$$.reactionsToUpdate.values()].forEach(updatable => {
					$$.reactionsToUpdate.delete(updatable);
					updatable();
				});
			}
			typeof $$.options.afterRun === "function" && $$.options.afterRun();
		}
		finally {
			$$.inRunSection = false;
		}
	}

	/**
	 * Executes all reactions that marked as invalid
	 * Unlike {@link run}, 'runDeferred' makes it not immediately but after 'timeout'
	 *
	 * @param {Function} [action] changes of {@link Observable} that happens inside 'action' function
	 * will not trigger immediate execution of dependent reactions
	 * @param {Number} [timeout=0] reactions execution delay
	 */
	runDeferred (action, timeout = 0) {
		const manager = this;
		const $$ = $(manager);
		if (!$$.options.enabled) {
			return;
		}
		$$.inRunSection = true;
		try {
			if (!$$.runScheduled) {
				$$.runScheduled = setTimeout(() => this.run(), timeout);
			}
			if (typeof action === "function") {
				action();
			}
		}
		finally {
			$$.inRunSection = false;
		}
	}
}

Manager.default = new Manager();
Manager.default.Manager = Manager;

export default Manager.default;
export const observable = Manager.default.observable;
export const reaction = Manager.default.reaction;
export const computed = Manager.default.computed;
export const updatable = Manager.default.updatable;

/**
 * @typedef ManagerOptions
 * @name ManagerOptions
 * @type {Object}
 * @property {Boolean} [immediateReaction=false] if set to `true` reactions will be executed immediately on same event loop
 * otherwise it will be executed after zero timeout (on next event loop)
 * @property {Boolean} [enabled=true] - state of data manager, if it is disabled then reactions will not be executed
 */

/**
 * @typedef Observable
 * @name Observable
 * @description Object or array that will be observed for changes.
 * When the property of type {@link Object} or {@link Array} of {@link Observable}
 * are accessed it automaticaly becomes {@link Observable}
 */

/**
 * @typedef UpdatableFunction
 * @name UpdatableFunction
 * @property {Function} uninit
 * @description function that caches result of its execution and returns cached value if function state is valid
 * function state can be invalidated if some of {@link Observable} objects that were accessed on previous call are changed
 */

/**
  * @typedef UpdatableSettings
  * @name UpdatableSettings
  * @type {Object}
  * @property {Function} onInvalidate callback function that will be executed when UpdatableState of {@link UpdatableFunction} becomes invalid
  * @property {Function} onUninit callback function that will be executed after {@link UpdatableFunction#uninit} is called
  * @description Settings to create {@link UpdatableFunction}
  */
