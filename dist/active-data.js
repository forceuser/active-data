(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["activeData"] = factory();
	else
		root["activeData"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Manager", function() { return Manager; });
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Реактивный менеджер данных, следящий за изменениями данных и выполняющий действия в ответ на эти изменения
* Отслеживание происходит лениво, данные обновляются только когда они требуются
*
* @param {ManagerOptions} [options] Настройки менеджера
*/
var Manager = function () {
	function Manager(options) {
		_classCallCheck(this, Manager);

		this.$isObservableSymbol = Symbol("isObservable");
		this.$registerRead = Symbol("registerRead");
		this.$dataSource = Symbol("dataSource");
		this.observables = new WeakMap();
		this.cache = new WeakMap();
		this.options = {
			enabled: true,
			immediateReaction: false
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


	_createClass(Manager, [{
		key: "setOptions",
		value: function setOptions() {
			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			this.options = Object.assign(this.options, options);
		}
		/**
  * Создает {@link Observable} объект для указанного источника данный
  *
  * @param {(Object|Array)} dataSource источник данных
  * @return {Observable} отслеживаемый объект
  */

	}, {
		key: "makeObservable",
		value: function makeObservable(dataSource) {
			var manager = this;
			if (!dataSource) {
				return dataSource;
			}
			if (this.isObservable(dataSource)) {
				return dataSource;
			}
			var observable = manager.observables.get(dataSource);
			if (!observable) {
				var toUpdate = new Map();
				var invalidateDeps = function invalidateDeps(record) {
					record.valid = false;
					record.deps.forEach(function (record) {
						return invalidateDeps(record);
					});
					record.deps.clear();
				};

				var registerRead = function registerRead(record, key, prototypes) {
					// record stores Updateble state
					var updates = toUpdate.get(key);
					if (!updates) {
						updates = { records: new Set(), recordMap: new WeakMap() };
						toUpdate.set(key, updates);
					}
					updates.records.add(record);
					var recordMapItem = updates.recordMap.get(record);
					if (!recordMapItem) {
						recordMapItem = {};
						updates.recordMap.set(record, recordMapItem);
					}
					var isRoot = !prototypes;
					if (isRoot) {
						prototypes = [dataSource];
						recordMapItem.root = true;
					} else {
						var rootObj = prototypes[prototypes.length - 1];
						if (!recordMapItem.prototypes) {
							recordMapItem.prototypes = new Map();
						}
						var _prototypes = recordMapItem.prototypes.get(rootObj);
						if (_prototypes) {
							return;
						}
						recordMapItem.prototypes.set(rootObj, prototypes);
					}

					var proto = Object.getPrototypeOf(dataSource);
					while (proto != null && proto != Object.prototype) {
						var observableProto = manager.observables.get(proto);
						prototypes.unshift(proto);
						if (observableProto != null && observableProto !== Object.prototype) {
							observableProto[manager.$registerRead](record, key, prototypes);
							break;
						}
						proto = Object.getPrototypeOf(proto);
					}
				};

				observable = new Proxy(dataSource, {
					get: function get(obj, key) {
						if (key === manager.$isObservableSymbol) {
							return true;
						}
						if (key === manager.$dataSource) {
							return dataSource;
						}

						if (manager.callStack.length) {
							if (key === manager.$registerRead) {
								return registerRead;
							}
							registerRead(manager.callStack[manager.callStack.length - 1].record, key);
						}

						var val = obj[key];
						if (val === Object(val) && typeof val !== "function") {
							return manager.makeObservable(val);
						}
						return val;
					},
					set: function set(obj, key, val) {
						if (manager.callStack && manager.callStack.length) {
							throw new Error("Changing observable objects is restricted inside computed properties and reaction functions!");
						}

						if (val !== obj[key] || Array.isArray(obj) && key === "length") {
							obj[key] = val;
							var updates = toUpdate.get(key);
							if (updates) {
								updates.records.forEach(function (record) {
									var recordMapItem = updates.recordMap.get(record);
									if (recordMapItem.root) {
										invalidateDeps(record);
									} else {
										var invalidateAll = Array.from(recordMapItem.prototypes.values()).some(function (prototypes) {
											var idx = prototypes.indexOf(obj) + 1;
											var l = prototypes.length;
											var invalidate = true;
											for (var i = idx; i < l; i++) {
												if (prototypes[i].hasOwnProperty(key)) {
													invalidate = false;
													break;
												}
											}
											return invalidate;
										});
										if (invalidateAll) {
											invalidateDeps(record);
										}
									}
								});
							}

							toUpdate.delete(key);
							if (!manager.inRunSection) {
								if (manager.options.immediateReaction) {
									manager.run();
								} else {
									manager.runDeferred();
								}
							}
						}
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

	}, {
		key: "makeUpdatable",
		value: function makeUpdatable(call) {
			var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			var manager = this;
			if (obj == null) {
				obj = manager;
			}
			return function () {
				var cacheByObject = manager.cache.get(obj);
				var record = void 0;
				if (cacheByObject) {
					record = cacheByObject.get(call);
				} else {
					cacheByObject = new Map();
					manager.cache.set(obj, cacheByObject);
				}

				if (!record) {
					record = { valid: false, value: undefined, deps: new Set() };
					cacheByObject.set(call, record);
				}
				if (record.computing) {
					console.warn("Detected cross reference inside computed properties! undefined will be returned to prevent infinite loop");
					return undefined;
				}
				if (manager.callStack.length) {
					record.deps.add(manager.callStack[manager.callStack.length - 1].record);
				}

				if (record.valid) {
					return record.value;
				}
				record.computing = true;
				manager.callStack.push({ obj: obj, call: call, record: record });
				try {
					var context = void 0;
					if (this) {
						context = manager.observables.get(this);
					} else {
						context = manager;
					}

					var value = call.call(context, context);
					record.valid = true;
					record.value = value;
					return value;
				} finally {
					record.computing = false;
					manager.callStack.pop();
				}
			};
		}
		/**
  * Создает вычисляемое свойство объекта
  *
  * @param {Object} obj Объект для которого будет создано вычисляемое свойство
  * @param {String} key Имя вычисляемого свойства свойства
  * @param {Function} callOnGet Функция которая будет вычислятся при доступе к свойству
  * @param {Function} [callOnSet] Функция которая будет выполнятся при установке значения свойства
  */

	}, {
		key: "makeComputed",
		value: function makeComputed(obj, key, callOnGet, callOnSet) {
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

	}, {
		key: "makeReaction",
		value: function makeReaction(call) {
			var run = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

			var manager = this;
			var updatable = this.makeUpdatable(call);
			manager.reactions.push(updatable);
			if (run) {
				if (this.options.immediateReaction) {
					manager.run();
				} else {
					manager.runDeferred();
				}
			}
			return {
				unregister: function unregister() {
					var idx = manager.reactions.indexOf(updatable);
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

	}, {
		key: "isObservable",
		value: function isObservable(obj) {
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

	}, {
		key: "run",
		value: function run(action) {
			if (!this.options.enabled) {
				return;
			}
			this.inRunSection = true;
			try {
				if (typeof action === "function") {
					action();
				}
				this.runScheduled = false;
				this.reactions.forEach(function (updatable) {
					return updatable();
				});
				typeof this.onAfterRun === "function" && this.onAfterRun();
			} finally {
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

	}, {
		key: "runDeferred",
		value: function runDeferred(action) {
			var _this = this;

			if (!this.options.enabled) {
				return;
			}
			this.inRunSection = true;
			try {
				if (!this.runScheduled) {
					this.runScheduled = setTimeout(function () {
						return _this.run();
					});
				}
				if (typeof action === "function") {
					action();
				}
			} finally {
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

	}, {
		key: "getObservableSource",
		value: function getObservableSource(observable) {
			return observable[this.$dataSource];
		}
	}]);

	return Manager;
}();

Manager.default = new Manager();
Manager.default.Manager = Manager;

/* harmony default export */ __webpack_exports__["default"] = (Manager.default);

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

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0).default;

/***/ })
/******/ ]);
});
//# sourceMappingURL=active-data.js.map