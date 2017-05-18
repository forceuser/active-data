# active-data | [![Build Status](https://travis-ci.org/forceuser/active-data.svg?branch=master)](https://travis-ci.org/forceuser/active-data) [![Coverage Status](https://img.shields.io/codecov/c/github/forceuser/active-data/master.svg)](https://codecov.io/gh/forceuser/active-data) [![dependency Status](https://img.shields.io/npm/v/active-data.svg)](https://www.npmjs.com/package/active-data)

Tiny and convenient reactive data manager, inspired by MobX. Automatically detects associated data and performs updates to your views or everything dependent on that data when it changes. Implemented with javascript Proxy objects

## Installation

#### Install as npm package

```shell
npm i active-data
```

#### Or just use CDN

```html
<script src="//cdn.rawgit.com/forceuser/active-data/releases/download/1.0.1/active-data.min.js"></script>
```

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

data.makeComputed(ad, "fullName", self => `${self.firstName} ${self.lastName}`);

ad.makeAutorun(() => {
	console.log(data.welcomeMessage + " " data.fullName);
});
// "Hello, Luke Skywalker" will be printed immediately (can be configured)

data.firstName = "Leia"; // will print "Hello, Leia Skywalker"

ad.run(() => {// group changes and run autorun only at the end
	data.firstName = "Anakin";
	data.welcomeMessage = "Welcome to dark side,"
});
// will print "Welcome to dark side, Anakin Skywalker"

```

## Compatibility

#### Browsers

Chrome | Edge | Firefox | Internet Explorer | Opera | Safari
-------|------|---------|-------------------|-------|-------
49 | 12 | 18 | *No support* | 36 | 10

#### Servers/runtimes

Supported on **Node.js** version **6** or higher

#### Proxy compatibility tables

https://kangax.github.io/compat-table/es6/#test-Proxy

http://caniuse.com/#feat=proxy
