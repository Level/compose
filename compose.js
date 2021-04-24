'use strict'

module.exports = function compose () {
  const layers = []

  function shell (location, options, callback) {
    if (typeof location === 'function') {
      callback = location
      options = {}
      location = null
    } else if (typeof location === 'object' && location !== null) {
      callback = options
      options = location
      location = null
    }

    if (typeof options === 'function') {
      callback = options
      options = {}
    } else if (typeof options !== 'object' || options === null) {
      options = {}
    }

    return layers.reduce(function (db, layer, index) {
      if (index < layers.length - 1) {
        return layer(db, options)
      } else {
        // Last layer takes an optional open-callback
        db = layer(db, options, callback)

        // Transitional utility.
        // If db is levelup, it will auto-open and call the callback. If
        // abstract-leveldown, it won't. If abstract-db (a concept), it might.
        if (callback && !isLevelup(db) && db.status === 'new') {
          db.open(Object.assign({}, layer.defaults, options), function (err) {
            if (err) return callback(err)
            callback(null, db)
          })
        }

        return db
      }
    }, location)
  }

  shell.use = function (layer, defaults) {
    if (Array.isArray(layer)) {
      for (let i = 0; i < layer.length; i++) {
        shell.use(layer[i], Object.assign({}, isOpts(layer[i + 1]) && layer[++i], defaults))
      }

      return shell
    }

    layers.push(function wrapped (db, options, callback) {
      wrapped.defaults = defaults
      return layer(db, Object.assign({}, defaults, options), callback)
    })

    decorate(shell, layer)

    return shell
  }

  shell.errors = null
  shell.use(Array.prototype.slice.call(arguments))

  return shell
}

function decorate (shell, nut) {
  if (nut.errors) {
    shell.errors = nut.errors
  }

  for (const m of ['destroy', 'repair']) {
    if (typeof nut[m] === 'function') {
      shell[m] = function (...args) {
        nut[m](...args)
      }
    }
  }
}

function isLevelup (db) {
  return typeof db === 'object' && db !== null && /^levelup$/i.test(db)
}

function isOpts (o) {
  return o == null || (typeof o === 'object' && !Array.isArray(o))
}
