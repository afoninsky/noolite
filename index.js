'use strict';
var SerialPort = require('serialport').SerialPort;
var Promise = require('bluebird');
var _ = require('lodash');

var commands = {
  OFF: 0,
  START_SMOOTH_DECREASE: 1,
  ON: 2,
  START_SMOOTH_INCREASE: 3,
  SWITCH: 4,
  REVERSE_SMOOTH: 5,
  SET: 6,
  RUN_SCENARIO: 7,
  SAVE_SCENARIO: 8,
  UNBIND: 9,
  STOP_SMOOTH: 10,
  BIND: 15
};

var defaults = {
  START: 85,
  STOP: 170,
  MODE: 80,
  CHANNELS: 31
};

var Driver = function (cfg) {

  this.cfg = _.defaults(cfg || {}, {
    port: '/dev/ttyAMA0',
    txTimeout: 500
  });

  this.serial = new SerialPort(this.cfg.port, {
    baudrate: 9600
  }, false);

  Promise.promisifyAll(this);
};

Driver.prototype.open = function (callback) {

  var serial = this.serial;
  serial.once('open', callback);

  serial.open(function (err) {
    if(err) {
      serial.removeListener('open', callback);
      return callback(err);
    }
  }.bind(this));
};

Driver.prototype.send = function (channel, command, cfg, callback) {

  if(typeof cfg === 'function') {
    callback = cfg;
    cfg = {};
  }
  var cmd = commands[command];
  if(typeof cmd === 'undefined') {
    return callback(new Error('command type "'+command+'" not supported'));
  }
  if(channel < 0 || channel > defaults.CHANNELS) {
    return callback(new Error('please specify channel in range 0..'+defaults.CHANNELS));
  }

  var arr = [defaults.START, defaults.MODE, 0, 0, 0, 0, 0, 0, 0, 0, 0, defaults.STOP];
  if(cfg.mode) {
    arr[1] = cfg.mode;
  }
  arr[2] = cmd;

  if(cmd === commands.SET) {
    var payload = cfg.payload;
    if(!_.isArray(payload)) {
      return callback(new Error('please specify array in cfg.brightness'));
    }
    arr[3] = 1;
    var start = 6, stop = start + payload.length;
    for(var i = start; i <= stop; i++) {
      arr[i] = payload[i - start];
    }
  }

  arr[5] = channel;
  arr[10] = arr.slice(0, 10).reduce(function(a, b){ return a+b; }) & 0xFF;
  this.sendRawWithResponse(arr, callback);
};

Driver.prototype.sendRawWithResponse = function (arr, callback) {
  var timer, serial = this.serial, cfg = this.cfg;

  var done = function (res, err) {
    serial.removeListener('data', done);
    clearTimeout(timer);
    if(!err && res.toString() !== 'OK\r\n') {
      err = new Error('wrong response from device');
    }
    return callback(err);
  };

  serial.write(arr, function (err, result) {
    if(err || result !== arr.length) {
      return callback(err || new Error('transmitted only '+result+' bytes'));
    }
    if(cfg.txTimeout) {
      serial.once('data', done);
      timer = setTimeout(done, cfg.txTimeout, null, new Error('timeout waiting response: wrong command sent?'));
    } else {
      serial.drain(callback);
    }
  });
};

module.exports = Driver;
module.exports.commands = commands;
