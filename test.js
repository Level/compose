'use strict'

const test = require('tape')
const encode = require('encoding-down')
const levelup = require('levelup')
const compose = require('.')

const packager = function (down) {
  return compose(down, encode, levelup)
}

// Tests copied from level-packager

test('packager - Level constructor has access to levelup errors', function (t) {
  function Down () {}
  t.ok(packager(Down).errors, '.errors property set on constructor')
  t.end()
})

test('packager - Level constructor relays .destroy if it exists', function (t) {
  t.plan(2)
  function Down () {}
  function callback () {}
  Down.destroy = function (location, cb) {
    t.is(location, 'location', 'location is correct')
    t.is(cb, callback, 'cb is set')
  }
  // Unlike level-packager, compose does not add a fallback callback (Level/packager#86)
  packager(Down).destroy('location', callback)
})

test('packager - Level constructor relays .repair if it exists', function (t) {
  t.plan(2)
  function Down () {}
  function callback () {}
  Down.repair = function (location, cb) {
    t.is(location, 'location', 'location is correct')
    t.is(cb, callback, 'cb is set')
  }
  // Unlike level-packager, compose does not add a fallback callback (Level/packager#86)
  packager(Down).repair('location', callback)
})

test('packager - Level constructor with default options', function (t) {
  t.plan(3)
  function Down (location) {
    t.is(location, 'location', 'location is correct')
    return {
      open: function (opts, cb) {}
    }
  }
  const levelup = packager(Down)('location')

  // In level-packager, this works because encoding-down mutates the shared
  // options object. That level-packager test should be updated.
  // t.is(levelup.options.keyEncoding, 'utf8')
  // t.is(levelup.options.valueEncoding, 'utf8')

  t.is(levelup._db.codec.opts.keyEncoding, 'utf8')
  t.is(levelup._db.codec.opts.valueEncoding, 'utf8')
})

test('packager - Level constructor with callback', function (t) {
  t.plan(4)
  function Down (location) {
    t.is(location, 'location', 'location is correct')
    return {
      open: function (opts, cb) {
        t.pass('open called')
        process.nextTick(cb)
      }
    }
  }
  packager(Down)('location', function (err, db) {
    t.error(err)
    t.ok(db, 'db set in callback')
  })
})

test('packager - Level constructor with custom options', function (t) {
  t.plan(3)
  const Down = function (location) {
    t.is(location, 'location', 'location is correct')
    return {
      open: function (opts, cb) {}
    }
  }
  const levelup = packager(Down)('location', {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  })
  t.is(levelup._db.codec.opts.keyEncoding, 'binary')
  t.is(levelup._db.codec.opts.valueEncoding, 'binary')
})

// Own tests
// TODO: write more

test('passes defaults only to preceding layer', function (t) {
  t.plan(12)

  compose(negative, positive, { test: true }, negative)('test-location')
  compose([negative, positive, { test: true }, negative])('test-location')
  compose().use([negative, positive, { test: true }, negative])('test-location')
  compose().use(negative).use(positive, { test: true }).use(negative)('test-location')

  function negative (dbOrLocation, options) {
    t.same(options, {}, 'did not get defaults')
    return dbOrLocation
  }

  function positive (dbOrLocation, options) {
    t.same(options, { test: true }, 'did get defaults')
    return dbOrLocation
  }
})

test('passes defaults only to preceding layers (in array)', function (t) {
  t.plan(4)

  compose(negative, [positive, positive], { test: true }, negative)('test-location')

  function negative (dbOrLocation, options) {
    t.same(options, {}, 'did not get defaults')
    return dbOrLocation
  }

  function positive (dbOrLocation, options) {
    t.same(options, { test: true }, 'did get defaults')
    return dbOrLocation
  }
})

test('merges defaults into preceding layers', function (t) {
  t.plan(9)

  const objects = { a: { a: 1 }, b: { b: 2 } }

  compose().use([b, [ab, ab], objects.a, b], objects.b)('test-location')
  compose().use(none).use([a, a], objects.a).use(b, objects.b)('test-location')

  t.same(objects, { a: { a: 1 }, b: { b: 2 } }, 'did not mutate original objects')

  function a (dbOrLocation, options) {
    t.same(options, { a: 1 }, 'only a')
    return dbOrLocation
  }

  function b (dbOrLocation, options) {
    t.same(options, { b: 2 }, 'only b')
    return dbOrLocation
  }

  function ab (dbOrLocation, options) {
    t.same(options, { a: 1, b: 2 }, 'a and b')
    return dbOrLocation
  }

  function none (dbOrLocation, options) {
    t.same(options, {}, 'none')
    return dbOrLocation
  }
})

test('passes defaults to abstract db.open() if callback is provided', function (t) {
  t.plan(20)

  compose(lastLayer, { test: true })('test-location', onOpen)
  compose([firstLayer, lastLayer], { test: true })('test-location', onOpen)
  compose([[firstLayer, lastLayer], { test: false }], { test: true })('test-location', onOpen)

  function firstLayer (location, options, callback) {
    t.is(callback, undefined, 'only last layer receives callback')
    return location
  }

  function lastLayer (location, options, callback) {
    t.is(location, 'test-location', 'got location')
    t.same(options, { test: true }, 'got options')
    t.is(callback, onOpen, 'got callback')

    // Mock abstract-leveldown
    return {
      status: 'new',
      mocked: true,
      open: function (options, callback) {
        t.same(options, { test: true }, 'got open() options')
        process.nextTick(callback)
      }
    }
  }

  function onOpen (err, db) {
    t.ifError(err, 'no open error')
    t.is(db.mocked, true, 'got db')
  }
})
