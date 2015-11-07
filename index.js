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
    txTimeout: false
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

Driver.prototype.send = function (channel, param, callback) {
  if(typeof param === 'string') {
    param = { command: param };
  }
  param.command = param.command.toUpperCase();
  var cmd = commands[param.command];
  if(typeof cmd === 'undefined') {
    return callback(new Error('command type "'+param.command+'" not supported'));
  }
  if(channel < 0 || channel > defaults.CHANNELS) {
    return callback(new Error('please specify channel in range 0..'+defaults.CHANNELS));
  }

  var arr = [defaults.START, defaults.MODE, 0, 0, 0, 0, 0, 0, 0, 0, 0, defaults.STOP];
  if(param.mode) {
    arr[1] = param.mode;
  }
  arr[2] = cmd;

  if(cmd === commands.SET) {
    var value = param.value;
    if(!_.isArray(value)) { value = [ value ]; }
    if(isNaN(value[0]) || value[0] < 0 || value[0] > 255) {
      // 35-155 for dim and 0-255 for rgb
      return callback(new Error('please specify correct array in .value'));
    }
    if(value.length === 1) {
      arr[3] = 1;
    } else if (value.length === 3) {
      arr[3] = 3;
    } else {
      return callback(new Error('.value should have length 1 for brightness or length 3 for rgb'));
    }
    var start = 6, stop = start + value.length;
    for(var i = start; i <= stop; i++) {
      arr[i] = value[i - start] || 0;
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
