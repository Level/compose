'use strict'

var test = require('tape')
var encode = require('encoding-down')
var levelup = require('levelup')
var compose = require('.')

var packager = function (down) {
  return compose(down, encode, levelup)
}

// Tests copied from level-packager
// TODO: write own tests

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
  var levelup = packager(Down)('location')

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
  var Down = function (location) {
    t.is(location, 'location', 'location is correct')
    return {
      open: function (opts, cb) {}
    }
  }
  var levelup = packager(Down)('location', {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  })
  t.is(levelup._db.codec.opts.keyEncoding, 'binary')
  t.is(levelup._db.codec.opts.valueEncoding, 'binary')
})
