/**
* Реактивный менеджер данных, следящий за изменениями данных и выполняющий действия в ответ на эти изменения
* Отслеживание происходит лениво, данные обновляются только когда они требуются
*
* @param {ManagerOptions} [options] Настройки менеджера
*/
export class Manager {
	constructor (options) {
		this.$isObservableSymbol = Symbol("isObservable");
		this.$registerRead = Symbol("registerRead");
		this.$dataSource = Symbol("dataSource");
		this.observables = new WeakMap();
		this.cache = new WeakMap();
		this.options = {
			enabled: true,
			immediateReaction: false,
			wholeObjectObserveKey: "$$whole"
		};
		this.callStack = [];
		this.reactions = [];
		this.setOptions(options);
	}
	/**
	* Динамически устанавливает настройки работы менеджера данных
	*
	* @param {ManagerOptions} [options] Настройки менеджера
	*/
	setOptions (options = {}) {
		this.options = Object.assign(this.options, options);
	}
	/**
	* Создает {@link Observable} объект для указанного источника данный
	*
	* @param {(Object|Array)} dataSource источник данных
	* @return {Observable} отслеживаемый объект
	*/
	makeObservable (dataSource) {
		const manager = this;
		if (!dataSource) {
			return dataSource;
		}
		if (this.isObservable(dataSource)) {
			return dataSource;
		}
		let observable = manager.observables.get(dataSource);
		if (!observable) {
			const toUpdate = new Map();
			const invalidateDeps = (updatableState) => {
				if (updatableState.valid) {
					updatableState.valid = false;
					updatableState.deps.forEach(updatableState => invalidateDeps(updatableState));
				}
				updatableState.deps.clear();
			};

			const initUpdates = (key) => {
				const updates = {updatableStates: new Set(), updatableStateMap: new WeakMap()};
				toUpdate.set(key, updates);
				return updates;
			};

			const registerRead = (updatableState, key, prototypes) => {
				// updatableState stores Updateble state
				let updates = toUpdate.get(key);
				if (!updates) {
					updates = initUpdates(key);
				}
				updates.updatableStates.add(updatableState);
				let updatableStateMapItem = updates.updatableStateMap.get(updatableState);
				if (!updatableStateMapItem) {
					updatableStateMapItem = {};
					updates.updatableStateMap.set(updatableState, updatableStateMapItem);
				}
				updatableState.uninit.set(dataSource, updatableState => {
					updates.updatableStates.delete(updatableState);
					updates.updatableStateMap.delete(updatableState);
					if (updates.updatableStates.size === 0) {
						toUpdate.delete(key);
					}
				});
				const isRoot = !prototypes;
				if (isRoot) {
					prototypes = [dataSource];
					updatableStateMapItem.root = true;
				}
				else {
					const rootObj = prototypes[prototypes.length - 1];
					if (!updatableStateMapItem.prototypes) {
						updatableStateMapItem.prototypes = new Map();
					}
					const _prototypes = updatableStateMapItem.prototypes.get(rootObj);
					if (_prototypes) {
						return;
					}
					updatableStateMapItem.prototypes.set(rootObj, prototypes);
				}

				let proto = Object.getPrototypeOf(dataSource);
				while (proto != null && proto != Object.prototype) {
					const observableProto = manager.observables.get(proto);
					prototypes.unshift(proto);
					if (observableProto != null && observableProto !== Object.prototype) {
						observableProto[manager.$registerRead](updatableState, key, prototypes);
						break;
					}
					proto = Object.getPrototypeOf(proto);
				}
			};

			const updateProperty = (obj, key) => {
				[key, manager.options.wholeObjectObserveKey].forEach(updKey => {
					const updates = toUpdate.get(updKey);
					if (updates) {
						updates.updatableStates.forEach((updatableState) => {
							const updatableStateMapItem = updates.updatableStateMap.get(updatableState);
							if (updatableStateMapItem.root) {
								invalidateDeps(updatableState);
							}
							else {
								const invalidateAll = Array.from(updatableStateMapItem.prototypes.values())
								.some((prototypes) => {
									const idx = prototypes.indexOf(obj) + 1;
									const l = prototypes.length;
									let invalidate = true;
									for (let i = idx; i < l; i++) {
										if (prototypes[i].hasOwnProperty(key)) {
											invalidate = false;
											break;
										}
									}
									return invalidate;
								});
								if (invalidateAll) {
									invalidateDeps(updatableState);
								}
							}
						});

					}
				});

				// toUpdate.delete(key);

				if (!manager.inRunSection) {
					if (manager.options.immediateReaction) {
						manager.run();
					}
					else {
						manager.runDeferred();
					}
				}
			};


			observable = new Proxy(dataSource, {
				get: (obj, key, context) => {
					if (key === manager.$isObservableSymbol) {
						return true;
					}
					if (key === manager.$dataSource) {
						return dataSource;
					}

					const propertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);

					if (propertyDescriptor && typeof propertyDescriptor.get === "function") {
						return manager.makeUpdatable(propertyDescriptor.get, obj).call(obj);
					}

					if (manager.callStack.length) {
						if (key === manager.$registerRead) {
							return registerRead;
						}
						registerRead(manager.callStack[manager.callStack.length - 1].updatableState, key);
					}

					if (key === manager.options.wholeObjectObserveKey) {
						return context;
					}

					const val = obj[key];
					if (typeof val === "object") {
						return manager.makeObservable(val);
					}
					return val;
				},
				set: (obj, key, val) => {
					if (manager.callStack && manager.callStack.length) {
						throw new Error("Changing observable objects is restricted inside computed properties and reaction functions!");
					}

					if (val !== obj[key] || (Array.isArray(obj) && key === "length")) {
						obj[key] = val;
						updateProperty(obj, key);
					}
					return true;
				},
				deleteProperty: (obj, key) => {
					updateProperty(obj, key);
					return true;
				}
			});
			manager.observables.set(dataSource, observable);
		}
		return observable;
	}
	/**
	* Создает {@link UpdatableFunction}
	* Используется в основном для внутренних целей
	*
	* @param {Function} call Функция для которой будет создана {@link UpdatableFunction}
	* @param {Object} obj Если `call` это метод объекта необходимо указать связанный объект
	* @return {UpdatableFunction}
	*/
	makeUpdatable (call, obj = null) {
		if (call.updatableCall) {
			return call;
		}
		const manager = this;
		if (obj == null) {
			obj = manager;
		}
		let updatableFunction;
		let objectCallCache = manager.cache.get(obj);

		if (objectCallCache) {
			updatableFunction = objectCallCache.get(call);
		}
		else {
			objectCallCache = new Map();
			manager.cache.set(obj, objectCallCache);
		}
		if (!updatableFunction) {
			const updatableState = {valid: false, value: undefined, deps: new Set(), uninit: new Map()};
			updatableFunction = function () {
				if (updatableState.computing) {
					console.warn("Detected cross reference inside computed properties! undefined will be returned to prevent infinite loop");
					return undefined;
				}
				if (manager.callStack.length) {
					updatableState.deps.add(manager.callStack[manager.callStack.length - 1].updatableState);
				}

				if (updatableState.valid) {
					return updatableState.value;
				}
				updatableState.computing = true;
				updatableState.uninit.forEach(uninit => uninit(updatableState));
				updatableState.uninit.clear();

				manager.callStack.push({obj, call, updatableState});
				try {
					let context;
					if (this) {
						context = manager.observables.get(this);
					}
					else {
						context = manager;
					}
					const value = call.call(context, context);
					updatableState.valid = true;
					updatableState.value = value;
					return value;
				}
				finally {
					updatableState.computing = false;
					manager.callStack.pop();
				}
			};
			updatableFunction.updatableCall = call;
			objectCallCache.set(call, updatableFunction);
		}
		return updatableFunction;
	}
	/**
	* Создает вычисляемое свойство объекта
	*
	* @param {Object} obj Объект для которого будет создано вычисляемое свойство
	* @param {String} key Имя вычисляемого свойства свойства
	* @param {Function} callOnGet Функция которая будет вычислятся при доступе к свойству
	* @param {Function} [callOnSet] Функция которая будет выполнятся при установке значения свойства
	*/
	makeComputed (obj, key, callOnGet, callOnSet) {
		Object.defineProperty(obj, key, {
			enumerable: true,
			get: this.makeUpdatable(callOnGet, obj),
			set: callOnSet
		});
	}
	/**
	* Создает {@link UpdatableFunction} и помещает ее в список для проверки
	* на валидность при изменении данных. Менеджер автозапускает эту
	* функцию если ее результат стал невалидным
	*
	* @param {Function} call
	*	Функция для которой будет создана {@link UpdatableFunction}
	*	Она будет автозапускатся при изменении {@link Observable} данных использованых при ее вычислении
	* @param {Boolean} run
	*	Выполнить первый запуск реации после ее регистрации.
	*	В зависимости от указанной опции {@link ManagerOptions.immediateReaction}
	*	будет запускатся либо сразу либо по таймауту.
	*	Если {@link ManagerOptions.enabled} == false то реакция не будет выполнятся даже при установленном параметре run
	* @return {ReactionHandler} Управляющий объект для зарегестрированной реакции
	*/
	makeReaction (call, run = true) {
		const manager = this;
		const updatable = this.makeUpdatable(call);
		manager.reactions.push(updatable);
		if (run) {
			if (this.options.immediateReaction) {
				manager.run();
			}
			else {
				manager.runDeferred();
			}
		}
		return {
			unregister () {
				const idx = manager.reactions.indexOf(updatable);
				if (idx >= 0) {
					manager.reactions.splice(idx, 1);
				}
			},
			reaction: updatable
		};
	}

	/**
	* Проверяет является ли объект наблюдаемым
	*
	* @param {(Observable|Object|Array)} obj
	*/
	isObservable (obj) {
		return obj[this.$isObservableSymbol] === true;
	}
	/**
	* Запускает все автозапускаемые функции которые помечены как невалидные
	*
	* @param {Function} [action]
	*	Действия выполняемые внутри вызова этой функции
	* 	не будут вызывать неотложный запуск реакций.
	* 	Реакции будут запущены только после выхода из функции action
	*/
	run (action) {
		if (!this.options.enabled) {
			return;
		}
		this.inRunSection = true;
		try {
			if (typeof action === "function") {
				action();
			}
			this.runScheduled = false;
			this.reactions.forEach(updatable => updatable());
			typeof this.onAfterRun === "function" && this.onAfterRun();
		}
		finally {
			this.inRunSection = false;
		}
	}
	/**
	* Запускает все {@link UpdatableFunction} которые помечены как невалидные
	* В отличии от метода {@link run} запускает их не сразу а по указанному таймауту
	*
	* @param {Function} [action] Изменения {@link Observable} выполняемые внутри вызова этой функции не будут вызывать неотложный запуск реакций. Реакции будут запускатся после заданного таймаута
	* @param {Number} [timeout=0] Таймаут запуска выполнения очереди зарегестрированых реакций
	*/
	runDeferred (action) {
		if (!this.options.enabled) {
			return;
		}
		this.inRunSection = true;
		try {
			if (!this.runScheduled) {
				this.runScheduled = setTimeout(() => this.run());
			}
			if (typeof action === "function") {
				action();
			}
		}
		finally {
			this.inRunSection = false;
		}
	}
	/**
	* Возвращает исходный объект на основе которого был создан {@link Observable}
	*
	* @param {Observable} observable
	*	{@link Observable} для которого необходимо получить исходный объект
	* @return {(Object|Array)} Исходный обьект на основе которого был создан {@link Observable}
	*/
	getObservableSource (observable) {
		return observable[this.$dataSource];
	}
}

// const aliases = {
// 	"makeReaction": ["reaction", "observe"],
// 	"makeObservable": ["observable"],
// 	"makeUpdatable": ["updatable"],
// 	"makeComputed": ["computed"]
// };
//
// Object.keys(aliases).forEach(key => {
// 	aliases[key].forEach(alias => {
// 		Manager.prototype[alias] = Manager.prototype[key];
// 	});
// });

Manager.default = new Manager();
Manager.default.Manager = Manager;

export default Manager.default;
export const observable = (...args) => Manager.default.makeObservable(...args);
export const observe = (...args) => Manager.default.makeReaction(...args);
export const reaction = (...args) => Manager.default.makeReaction(...args);
export const computed = (...args) => Manager.default.makeComputed(...args);
export const updatable = (...args) => Manager.default.makeUpdatable(...args);

/**
 * @typedef ManagerOptions
 * @name ManagerOptions
 * @type {Object}
 * @property {Boolean} immediateReaction - Запускать реакции сразу после изменения данных (по-умолчанию false - т.е. реакции выполняются по нулевому таймауту)
 * @property {Boolean} enabled - Активен ли менеджер данных (по-умолчнию true)
 */

 /**
  * @typedef ReactionHandler
  * @name ReactionHandler
  * @type {Object}
  * @property {Function} unregister - Удалить реакцию из списка зарегестрированных реакций
  * @property {UpdatableFunction} reaction - Фунция реакции
  */

 /**
  * @typedef Observable
  * @name Observable
  * @description Обьект или массив доступ к свойствам которого отслеживается.
  * При доступе к дочерним объектам или массивам также возвращается {@link Observable} объект
  */

/**
 * @typedef UpdatableFunction
 * @name UpdatableFunction
 * @description Функция которая кеширует результат своего выполнение и хранит состояние валидности результата
 *
 * При изменении {@link Observable} данных которые были использованы при вычилении этой функции ее кеш инвалидируется
 *
 * Внутри {@link UpdatableFunction} разрешено только чтение {@link Observable}, при записи будет брошено исключение
 *
 * Если внутри таких функций есть перекрестные ссылки то вычисление производится не будет, будет возвращено `undefined`
 */
