/**
 * noolite protocol family translator
 * pc11xx_hid, mt1132 - support: .command
 * rx2164 - support: .command, event
 *
 */
'use strict';

var util = require('util');
var _ = require('lodash');

// list of supported commands (events in case of rx2164)
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
  BIND: 15,
  START_SMOOTH: 16,
  SWITCH_COLOR: 17,
  SWITCH_MODE: 18,
  SWITCH_SPEED: 19,
  BATTERY: 20,
  SENSOR: 21
};

var commandKeys = _.keys(commands);

// rx2164 specific commands
var rxCommands = {
  BIND: 1,
  STOP_BIND: 2,
  UNBIND: 3,
  UNBIND_ALL: 4
};

// max channels, max commands, tx method, rx method
var devices = {
  mt1132: [32, 19, '_mt1132'],
  pc118: [8, 19, '_pc11xx'],
  pc1116: [16, 19, '_pc11xx'],
  pc1132: [32, 19, '_pc11xx'],
  rx2164: [64, 21, '_rx2164Out', '_rx2164In']
};

// mt1132 specific
var mt1132 = {
  START_BYTE: 85,
  STOP_BYTE: 170
};

var Protocol = function (_device) {

  var device = devices[_device];
  if(!device) {
    throw new Error(util.format('device "%s" is not supported', _device));
  }

  this.commands = (device === 'rx2164') ? rxCommands : commands;
  this.events = (device === 'rx2164') ? commands : null;
  this.maxChannels = device[0] - 1;
  this.mode = 80; // tx mode, repeat command 2 times, 1000bps

  this._command = device[2];
  this._event = device[3];
};

// translate readable command to array of bytes (write to device)
Protocol.prototype.command = function () {
  return this[this._command].apply(this, arguments);
};

// translate array of bytes into event (readed from device)
Protocol.prototype.event = function () {
  if(!this._event) {
    throw new Error('"event" method is not supported by this device type');
  }
  return this[this._event].apply(this, arguments);
};

// create packet for mt1132 device
// http://www.noo.com.by/assets/files/PDF/MT1132.pdf
Protocol.prototype._mt1132 = function (channel, command, value) {

  var res = this._parseInput(channel, command);
  var arr = [mt1132.START_BYTE, this.mode, res.command, 0, 0, res.channel, 0, 0, 0, 0, 0, mt1132.STOP_BYTE];

  // set specific command bytes
  if(res.command === this.commands.SET) {
    this._setDimPayload(arr, value, 3, 6);
  } else if(res.command >= this.commands.START_SMOOTH) {
    arr[3] = 4;
  }

  // checksum
  arr[10] = arr.slice(0, 10).reduce(function(a, b){ return a+b; }) & 0xFF;

  return arr;
};

// create packet for pc11xx devices
// http://www.noo.com.by/assets/files/software/PC11xx_HID_API.pdf
Protocol.prototype._pc11xx = function (channel, command, value) {

  var res = this._parseInput(channel, command);
  // mode, command, format, 0, channel, r, g, b
  var arr = [this.mode, res.command, 0, 0, res.channel, 0, 0, 0];

  // set specific command bytes
  if(res.command === this.commands.SET) {
    this._setDimPayload(arr, value, 2, 5);
  } else if(res.command >= this.commands.START_SMOOTH) {
    arr[2] = 4;
  }

  return arr;
};

// http://www.noo.com.by/assets/files/software/RX2164_HID_API.pdf
Protocol.prototype._rx2164Out = function (channel, command) {

  var res = this._parseInput(channel, command);

  var arr = [res.command, res.channel, 0, 0, 0, 0, 0, 0];
  return arr;
};

Protocol.prototype._parseInput = function (channel, _command) {
  // ensure channel is supported
  channel = parseInt(channel, 10);
  if(isNaN(channel) || channel < 0 || channel > this.maxChannels) {
      throw new Error(util.format('invalid channel "%s" (range is 0..%s)', channel, this.maxChannels));
  }

  // ensure command is supported
  var command = this.commands[(_command || '').toString().toUpperCase()];
  if(typeof command === 'undefined') {
    throw new Error(util.format('invalid command "%s"', _command));
  }
  return {
    channel: channel,
    command: command
  }
};

Protocol.prototype._setDimPayload = function (arr, value, formatAddr, payloadAddr) {
  if(!_.isArray(value)) { value = [ value ]; }

  if(value.length === 1) { // set common brightness
    var dim = parseInt(value[0], 10);
    if(isNaN(dim) || dim < 35 || dim > 155) {
      throw new Error('please specify correct dim value in range 35..155');
    }
    arr[payloadAddr] = dim;
    return;
  }
  if(value.length === 3) { // set brightness on rgb channels
    var stop = payloadAddr + value.length - 1;
    for(var i = payloadAddr; i <= stop; i++) {
      var rgb = parseInt(value[i - payloadAddr], 10);
      if(isNaN(rgb) || rgb < 0 || rgb > 255) {
        throw new Error('please specify correct array like [255, 255, 255]');
      }
      arr[i] = rgb;
    }
    arr[formatAddr] = 3;
    return;
  }
  throw new Error('incorrect value (integer or 3-dim array of integers expected)');
};

// http://www.noo.com.by/assets/files/software/RX2164_HID_API.pdf
Protocol.prototype._rx2164In = function (arr) {
  var data = {
    state: arr[0] & 63,
    isBinding: !!(arr[0] & 64),
    channel: arr[1],
    command: commandKeys[arr[2]],
    commandNumeric: arr[2]
  };
  if(arr[3]) {
    data.value = [];
    for(var i = 4, end = i + arr[3]; i < end; i++) {
      data.value.push(arr[i]);
    }
  }
  return data;
};

module.exports = Protocol;
module.exports.devices = _.keys(devices);
