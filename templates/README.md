# active-data

[![npm repository](https://img.shields.io/npm/v/active-data.svg)](https://www.npmjs.com/package/active-data)
[![Build Status](https://travis-ci.org/forceuser/active-data.svg?branch=master)](https://travis-ci.org/forceuser/active-data)
[![Coverage Status](https://img.shields.io/codecov/c/github/forceuser/active-data/master.svg)](https://codecov.io/gh/forceuser/active-data)
[![Known Vulnerabilities](https://snyk.io/test/github/forceuser/active-data/badge.svg)](https://snyk.io/test/github/forceuser/active-data)

Tiny and convenient reactive data manager, inspired by MobX. Automatically detects associated data and performs updates to your views or everything dependent on that data when it changes. Implemented with javascript Proxy objects

## Installation

#### Install as npm package

```shell
npm i active-data --save
```

#### Or simply download \*.js file

[active-data.js@{{version}}](https://github.com/forceuser/active-data/releases/download/{{version}}/active-data.js)

[active-data.modern.js@{{version}}](https://github.com/forceuser/active-data/releases/download/{{version}}/active-data.modern.js) *for modern browsers only (see [.browserlistrc](https://github.com/forceuser/active-data/blob/master/.browserslistrc))*

#### Or just load from CDN

```html
<script src="//cdn.jsdelivr.net/npm/active-data@{{version}}/dist/active-data.js" integrity="{{#ssri}}../dist/active-data.js{{/ssri}}" crossorigin="anonymous">
</script>
```

*if you need only modern browsers then use script below:*

```html
<script src="//cdn.jsdelivr.net/npm/active-data@{{version}}/dist/active-data.modern.js" integrity="{{#ssri}}../dist/active-data.modern.js{{/ssri}}" crossorigin="anonymous">
</script>
```

And then use **activeData** as global variable
```html
<script>
	data = activeData.makeObservable({c: 1});
	activeData.makeReaction(() => {
		document.body.innerHTML = `<button onclick="data.c++">${data.c}</button>`;
	});
</script>
```
## [Documentation](./DOCUMENTATION.md)

## Example

Run example with [runkit](https://npm.runkit.com/active-data)

```js
{{#file}}../tonic-example.js{{/file}}
```

## Compatibility

#### Browsers

| Chrome | Edge | Firefox | Internet Explorer | Opera | Safari |
| ------ | ---- | ------- | ----------------- | ----- | ------ |
| 49     | 12   | 18      | *No support*      | 36    | 10     |

#### Servers/runtimes

Supported on **Node.js** version **6** and higher

#### Proxy compatibility tables

https://kangax.github.io/compat-table/es6/#test-Proxy

http://caniuse.com/#feat=proxy
