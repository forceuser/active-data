# active-data | [![Build Status](https://travis-ci.org/forceuser/active-data.svg?branch=master)](https://travis-ci.org/forceuser/active-data) [![Coverage Status](https://img.shields.io/codecov/c/github/forceuser/active-data/master.svg)](https://codecov.io/gh/forceuser/active-data) [![dependency Status](https://img.shields.io/npm/v/active-data.svg)](https://www.npmjs.com/package/active-data)

Tiny and convenient reactive data manager, inspired by MobX. Automatically detects associated data and performs updates to your views or everything dependent on that data when it changes. Implemented with javascript Proxy objects

## Installation

#### Install as npm package

```shell
npm i active-data
```

#### Or just use CDN

```html
<script src="//cdn.rawgit.com/forceuser/active-data/releases/download/1.0.8/active-data.min.js">
</script>
```

## Why

I need a small, simple and convenient reactive data manager that propagates data changes. I don't really liked existing solutions to manage data like Redux and other Flux based architectures, they bring too much complex concepts and abstractions that are not natural to JavaScript world.

Then i came across MobX architecture, it looks very simple, it uses basic js concepts, and magic that happens behind the scenes seemed to me very elegant.

At that time i was experimenting with Proxy objects too much and i think that using proxies i can write own data manager as simple and small as possible while preserving all the functionality.

## Documentation

## Example
```js
import ad from "active-data";

ad.setOptions({
    immediateAutorun: true // make recalculations for each change
});

const data = ad.makeObservable({
    welcomeMessage: "Hello,",
    firstName: "Luke",
    lastName: "Skywalker"
});

ad.makeComputed(data, "fullName", self => `${self.firstName} ${self.lastName}`);

ad.makeAutorun(() => {
    console.log(data.welcomeMessage + " " + data.fullName);
});
// "Hello, Luke Skywalker" will be printed immediately (can be configured)

data.firstName = "Leia"; // will print "Hello, Leia Skywalker"

ad.run(() => {
    // group changes and run autorun function only at the end
    data.firstName = "Anakin";
    data.welcomeMessage = "Welcome to dark side,";
});
```

## More examples

## Core concepts

#### Observable
It is the object or array that tracking its changes, and propagates it to its consumers.
Childs of obsevable are also observable

```js
const d = ad.makeObservable({
	a: 1,
	b: 2,
	c: {value: "111"},
	e: 5
});

ad.isObsrvable({}); // false
ad.isObsrvable(d); // true
ad.isObsrvable(d.a); // false
ad.isObsrvable(d.c); // true

```
#### Computed property

```js
let runCount = 0;
ad.makeComputed(d, "computed", self => {
	runCount++;
	return self.a + self.b;
});
console.log(d.computed, runCount); // 3, 1
console.log(d.computed, runCount); // 3, 1
// second time value taken from cache (no dependencies changed)
self.a = 5;
console.log(runCount); // 1
console.log(d.computed, runCount); // 7, 2
// computed value recalculated lazily
```
#### Autorun function
Function that runs automatically when some of its dependencies (observable data that is used inside function or computed properties) are changes. For example render functions. Dependencies are detected automatically on the previous run
There are two modes of autorun:
- when it runs in next tick (thru setTimeout) (by default)
- when it runs immediately after dependencies changes

```js
const d = ad.makeObservable({a: 1, b: 2, e: 5});
ad.setOptions({immediateAutorun: true}); // immediate apply changes for debug purpose
ad.makeAutorun(() => console.log("result:", d.e + d.computed));
// result: 8
d.b = 12;
// result: 18

```

#### Manually run autorun cycle
There may be situation when we want manually trigger autorun,

#### Group multiple immediate actions

## How it works

In order to intercept setting and getting values of the properties of the observable object, the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object is used

If the get operation of the property of the observed object results in object or an array, then a new observable object is returned, or it is taken from the cache, in case when Proxy for this object has already been created

The computed properties are implemented using [property descriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty), i.e. getters

Computed properties and autorun functions add themselves to the call stack at the start of their call. The stack is stored globally in the manager. If inside of them there is access to the properties of the observed objects, we intercept them, look at the stack and store the dependence of these functions from the stack on these properties of the observed objects.

The computed properties and autorun functions work through the cache. If they are not stored in the cache, they are considered to be invalid, i.e. the next time you access this property, it must be recalculated, flagged as valid and then stored to the cache.

When you write to the property of the observable object, all its dependent properties and autorun functions are flagged as invalid, the next access to them, they will be recalculated. After that, all registered invalid autorun functions are launched

If the property is marked as valid, its value is taken from the cache, and the valid autorun function is not automatically started by the manager.

## Compatibility

#### Browsers

Chrome | Edge | Firefox | Internet Explorer | Opera | Safari
-------|------|---------|-------------------|-------|-------
49 | 12 | 18 | *No support* | 36 | 10

#### Servers/runtimes

Supported on **Node.js** version **6** and higher

#### Proxy compatibility tables

https://kangax.github.io/compat-table/es6/#test-Proxy

http://caniuse.com/#feat=proxy
