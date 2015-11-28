'use strict';

/*
 * dummy device for testing purposes
 */

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var Dummy = function () {};
inherits(Dummy, EventEmitter);

Dummy.prototype.write = function (data, callback) {
  if(callback) { callback(); }
};

Dummy.prototype.close = function (callback) {
  if(callback) { callback(); }
};

Dummy.prototype.setNonBlocking = function () {};

module.exports = Dummy;
