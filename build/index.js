!function(e){function __webpack_require__(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,__webpack_require__),n.l=!0,n.exports}var r={};__webpack_require__.m=e,__webpack_require__.c=r,__webpack_require__.i=function(e){return e},__webpack_require__.d=function(e,r,t){__webpack_require__.o(e,r)||Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:t})},__webpack_require__.n=function(e){var r=e&&e.__esModule?function getDefault(){return e.default}:function getModuleExports(){return e};return __webpack_require__.d(r,"a",r),r},__webpack_require__.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},__webpack_require__.p="",__webpack_require__(__webpack_require__.s=1)}([function(e,r,t){"use strict";function _toConsumableArray(e){if(Array.isArray(e)){for(var r=0,t=Array(e.length);r<e.length;r++)t[r]=e[r];return t}return Array.from(e)}function _classCallCheck(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(r,"__esModule",{value:!0}),t.d(r,"Manager",function(){return a});var n=function(){function defineProperties(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(e,r,t){return r&&defineProperties(e.prototype,r),t&&defineProperties(e,t),e}}(),a=function(){function Manager(){_classCallCheck(this,Manager),this.isObservableSymbol=Symbol("isObservable"),this.observables=new WeakMap,this.cache=new WeakMap,this.callStack=[],this.autorun=[]}return n(Manager,[{key:"makeObservable",value:function makeObservable(e){var r=this;if(!e)return e;if(this.isObservable(e))return e;var t=this.observables.get(e);if(!t){var n=new Map;t=new Proxy(e,{get:function get(e,t){if(t===r.isObservableSymbol)return!0;if(r.callStack.length){var a=[].concat(_toConsumableArray(r.callStack)),u=a[a.length-1];if(!u.keys.includes(t)){u.keys.push(t);var i=n.get(t);i||(i=[],n.set(t,i)),i.push(a)}}var o=e[t];return o===Object(o)?r.observable(o):o},set:function set(e,t,a,u){if(r.callStack&&r.callStack.length)throw new Error("Changing observable objects is restricted inside computed properties and autorun functions!");if(a!==e[t]){e[t]=a;var i=n.get(t);i&&i.forEach(function(e){e.reverse().some(function(e){var t=e.obj,n=e.call,a=r.cache.get(t),u=void 0;if(a&&(u=a.get(n)),!u||!u.valid)return!0;u.valid=!1})}),n.delete(t),r.runDeferred()}return!0}}),this.observables.set(e,t)}return t}},{key:"makeUpdatable",value:function makeUpdatable(e,r){var t=this;return function(){var n=t.cache.get(e),a=void 0;if(n?a=n.get(r):(n=new Map,t.cache.set(e,n)),a||(a={valid:!1,value:void 0},n.set(r,a)),a.computing)return void console.warn("Detected cross reference inside computed properties! undefined will be returned to prevent infinite loop");if(a.valid)return a.value;a.computing=!0,t.callStack.push({obj:e,call:r,keys:[]});try{var u=void 0;if(this){var i=t.observables.get(this);u=i||this}else u=t;var o=r.call(u,u);return a.valid=!0,a.value=o,o}finally{a.computing=!1,t.callStack.pop()}}}},{key:"makeComputed",value:function makeComputed(e,r,t){return Object.defineProperty(e,r,{enumerable:!0,get:this.makeUpdatable(e,t,e)}),e}},{key:"makeAutorun",value:function makeAutorun(e){var r=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],t=this,n=this.makeUpdatable(this,e);return t.autorun.push(n),r&&t.runDeferred(),function unregister(){var e=t.autorun.indexOf(n);e>=0&&t.autorun.splice(e,1)}}},{key:"isObservable",value:function isObservable(e){return!0===e[this.isObservableSymbol]}},{key:"run",value:function run(e){"function"==typeof e&&e(),this.runScheduled=!1,this.autorun.forEach(function(e){return e()}),"function"==typeof this.onAfterRun&&this.onAfterRun()}},{key:"runDeferred",value:function runDeferred(e){var r=this;this.runScheduled||(this.runScheduled=setTimeout(function(){return r.run()}),"function"==typeof e&&e())}}]),Manager}();a.default=new a,r.default=a.default},function(e,r,t){e.exports=t(0)}]);
//# sourceMappingURL=index.js.map