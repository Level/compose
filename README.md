# level-compose

> Compose a database factory from `abstract-leveldown` and `levelup` layers with predefined defaults per layer.

[![level badge][level-badge]](https://github.com/Level/awesome)
[![npm](https://img.shields.io/npm/v/level-compose.svg?label=&logo=npm)](https://www.npmjs.com/package/level-compose)
[![Node version](https://img.shields.io/node/v/level-compose.svg)](https://www.npmjs.com/package/level-compose)
[![Travis](https://img.shields.io/travis/com/Level/compose.svg?logo=travis&label=)](https://travis-ci.com/Level/compose)
[![Coverage Status](https://coveralls.io/repos/github/Level/compose/badge.svg)](https://coveralls.io/github/Level/compose)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Backers on Open Collective](https://opencollective.com/level/backers/badge.svg?color=orange)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/level/sponsors/badge.svg?color=orange)](#sponsors)

## Table Of Contents

<details><summary>Click to expand</summary>

- [Usage](#usage)
- [FAQ](#faq)
- [API](#api)
- [Contributing](#contributing)
- [Donate](#donate)
- [License](#license)

</details>

## Usage

```js
const compose = require('level-compose')
const leveldown = require('leveldown')
const encode = require('encoding-down')
const levelup = require('levelup')
```

In its simplest form:

```js
const factory = compose(leveldown, encode, levelup)
const db = factory('./db')
```

In node the above is functionally equivalent to `require('level')('./db')`. If you like a more expressive API the above can be written as:

```js
const factory = compose()
  .use(leveldown)
  .use(encode)
  .use(levelup)
```

Note that `compose(...x)` is the same as `compose().use(...x)`, just shorter if we have a single input. Let's define some defaults:

```js
const factory = compose()
  .use(leveldown)
  .use(encode, { valueEncoding: 'json' })
  .use(levelup)
```

We can also pass arrays (useful when layers are defined elsewhere):

```js
const factory = compose([
  leveldown,
  [encode, { valueEncoding: 'json' }],
  levelup
])
```

Options objects are given to the layer before it, or multiple layers if the argument preceding the options object is an array:

```js
const factory = compose([leveldown, encode, levelup], {
  valueEncoding: 'json'
})
```

We can also use these mechanisms to make a "preset":

```js
const preset = [encode, { valueEncoding: 'json' }]
const factory = compose(leveldown, preset)
```

Similarly, you could create a preset for `leveldown` with certain cache options. _This doesn't work yet because `leveldown` options must be passed to its `open()` method and not its constructor. Should we change that?_

```js
const cacheSize = 16 << 20 // 16 MB
const preset = [leveldown, { cacheSize }]
const factory = compose(preset, levelup)
```

The first layer can also be a function that merely returns a location:

```js
const tempy = require('tempy')
const location = (loc) => loc || tempy.directory()
const factory = compose(location, leveldown)

factory() // Returns a db in a temporary directory
factory('./db') // Returns a db in ./db
```

## FAQ

### What about [`level-packager`](https://github.com/Level/packager)?

`compose(down, encode, levelup)` is functionally equivalent to `packager(down)`. If you need exactly that, stick with `level-packager`, which is a "preset" meant for the most common use case: creating a database with encodings and deferred open. That preset is simple but cannot be changed. With `level-compose` you can create your own "presets" and specify default options per layer. Unlike `level-packager` however, `level-compose` does not include any layers of its own. You must install them separately.

This project is also meant as an exploration, to find differences between implementations and gaps in their composability. It asserts that if all `abstract-leveldown` implementations behave the same, it should be possible to chain them together in a generic way.

### What is a layer?

To `level-compose` a layer is just a function. That takes 1) an optional location or a `db` to be wrapped, 2) options and 3) an optional open-callback (which is currently only supported by `levelup`). The function should return a `db` object that has either an `abstract-leveldown` or `levelup` interface.

The behavior of a composed database depends on whether `levelup` is included in the layers. If it is, it must be the last and will make the database automatically open itself. If `levelup` is not included, you must open the database yourself and wait until it is before calling operations like `db.put()`. This will change somewhere in the future.

As a transitional utility, passing a callback into a composed database that doesn't use `levelup` will auto-open it:

```js
const factory = compose(leveldown)

factory('./db', function (err, db) {
  if (err) throw err // Failed to open
})
```

This also works for implementations that don't have a location:

```js
const memdown = require('memdown')
const factory = compose(memdown)

factory(function (err, db) {
  if (err) throw err // Failed to open
})
```

### Can't I just wrap functions myself?

Yes, absolutely. You don't have to use `level-compose` if you have no need to reuse its input or return value elsewhere.

### Does this work with `subleveldown`?

Not yet. Down the line it'd be nice if we could do something like:

```js
const subdown = require('subleveldown')
const storage = leveldown('./db')

const factory = compose()
  .use(storage)
  .use(subdown, { separator: '!' })
  .use(encode)

const db1 = factory({ prefix: '1', valueEncoding: 'utf8' })
const db2 = factory({ prefix: '2', valueEncoding: 'json' })
```

To get there, we plan to move functionality like deferred-open from `levelup` into `abstract-leveldown`. In addition `level-compose` would have to detect whether an argument is a `db` instance or an options object (or require it to be wrapped like `() => storage`).

## API

Yet to document.

## Contributing

[`Level/compose`](https://github.com/Level/compose) is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [Contribution Guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Donate

To sustain [`Level`](https://github.com/Level) and its activities, become a backer or sponsor on [Open Collective](https://opencollective.com/level). Your logo or avatar will be displayed on our 28+ [GitHub repositories](https://github.com/Level) and [npm](https://www.npmjs.com/) packages. 💖

### Backers

[![Open Collective backers](https://opencollective.com/level/backers.svg?width=890)](https://opencollective.com/level)

### Sponsors

[![Open Collective sponsors](https://opencollective.com/level/sponsors.svg?width=890)](https://opencollective.com/level)

## License

[MIT](LICENSE.md) © 2019-present [Contributors](CONTRIBUTORS.md).

[level-badge]: https://leveljs.org/img/badge.svg
