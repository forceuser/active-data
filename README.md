# active-data | [![Build Status](https://travis-ci.org/forceuser/active-data.svg?branch=master)](https://travis-ci.org/forceuser/active-data) [![Coverage Status](https://img.shields.io/codecov/c/github/forceuser/active-data/master.svg)](https://codecov.io/gh/forceuser/active-data) [![npm repository](https://img.shields.io/npm/v/active-data.svg)](https://www.npmjs.com/package/active-data) [![Known Vulnerabilities](https://snyk.io/test/github/forceuser/active-data/badge.svg)](https://snyk.io/test/github/forceuser/active-data)

Tiny and convenient reactive data manager, inspired by MobX. Automatically detects associated data and performs updates to your views or everything dependent on that data when it changes. Implemented with javascript Proxy objects

## Installation

#### Install as npm package

```shell
npm i active-data --save
```

#### Or simply download \*.js file

[active-data.js@1.1.7](https://github.com/forceuser/active-data/releases/download/1.1.7/active-data.js)

*or only for modern browsers (see [.browserlistrc](https://github.com/forceuser/active-data/blob/master/.browserslistrc))*

[active-data.modern.js@1.1.7](https://github.com/forceuser/active-data/releases/download/1.1.7/active-data.modern.js)

#### Or just load from CDN

```html
<script src="//cdn.rawgit.com/forceuser/active-data/1.1.7/dist/active-data.js">
</script>
```

And then use **activeData** as global variable
```html
<script>
    const data = activeData.makeObservable({c: 1});
    activeData.makeAutorun(() => {
        document.body.innerHTML = `<button onclick="data.c++">${data.c}</button>`;
    });
</script>
```
## [Documentation](./DOCUMENTATION.md)

## Example

Run example with [runkit](https://npm.runkit.com/active-data)

```js
const ad = require("active-data");

ad.setOptions({
	immediateReaction: true, // make recalculations for each change
});

const data = ad.makeObservable({
	welcomeMessage: "Hello,",
	firstName: "Luke",
	lastName: "Skywalker",
});

ad.makeComputed(data, "fullName", self => `${self.firstName} ${self.lastName}`);

ad.makeReaction(() => {
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
