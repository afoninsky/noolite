/*
 * noolite (http://www.noo.com.by) device support
 * work with HID(usb) devices - pc11xx (tx), rx2164 (tx/rx)
 * and UART devices - mt1132 (tx)
 *
 */

const ld = require('lodash')
const { SerialPort } = require('serialport')
const HID = require('node-hid');
const Promise = require('bluebird');
const { EventEmitter } = require('events')
const { inherits } = require('util')
// var Proto = require('./proto');
// var Dummy = require('./dummy');
//
// var usbDevices = ['pc118', 'pc1116', 'pc1132', 'rx2164'];
//
// var Driver = function (cfg) {
//   var devices = Proto.devices;
//
//   this.cfg = _.defaults(cfg, {
//     device: null,         // device name
//     port: '/dev/ttyAMA0', // mt1132: default port
//     vid: 5824,            // pc11xx_hid, rx2164: HID vendor id
//     pid: null,            // pc11xx_hid, rx2164: HID product id
//     readInerval: 200,
//     debug: false          // run dummy device
//   });
//
//   if(devices.indexOf(cfg.device) === -1) {
//     throw new Error('unsupported device, valid are: ' + devices.join(', '));
//   }
//   this.proto = new Proto(cfg.device);
//
//   this.isHID = usbDevices.indexOf(cfg.device) !== -1;
//   if(this.isHID && !this.cfg.pid) {
//     this.cfg.pid = cfg.device === 'rx2164' ? 1500 : 1503;
//   }
//   Promise.promisifyAll(this);
//   _.bindAll(this);
// };
//
// inherits(Driver, EventEmitter);
//
// Driver.prototype.emitError = function (err) {
//   this.emit('error', err);
// };
//
// Driver.prototype.readData = function () {
//   // have no idea why we can read from rx2164 using .getFeatureReport but can't using .read
//   var buffer = this.device.getFeatureReport(0xf2, 17),
//       data = this.proto.event(buffer);
//
//   if(data.state !== this._state) {
//     this._state = data.state;
//     this.emit('data', data.channel, data.command);
//   }
// };
//
// Driver.prototype.open = function (callback) {
//   var cfg = this.cfg, device;
//
//   var _callback = function (err) {
//     if(!err) {
//       device.on('error', this.emitError);
//       // can read events from device
//       if(this.proto._event) {
//         device.setNonBlocking(1);
//         var buffer = this.device.getFeatureReport(0xf2, 17),
//           data = this.proto.event(buffer);
//         this._state = data.state;
//         this.timer = setInterval(this.readData, cfg.readInerval);
//       }
//     }
//     callback(err);
//   }.bind(this);
//
//   if(cfg.debug) {
//     device = this.device = new Dummy();
//     return _callback();
//   }
//
//   if(this.isHID) {
//     try {
//       device = this.device = new HID.HID(cfg.vid, cfg.pid);
//     } catch (err) {
//       return _callback(err);
//     }
//     return _callback();
//   }
//
//   // open com-port
//   device = this.device = new SerialPort(cfg.port, {
//     baudrate: 9600
//   }, false);
//
//   device.once('open', _callback);
//   device.open(function (err) {
//     if(err) {
//       device.removeListener('open', _callback);
//       return _callback(err);
//     }
//   }.bind(this));
//
// };
//
// Driver.prototype.send = function (channel, command, value, callback) {
//
//   var arr;
//   if(typeof value === 'function') {
//     callback = value;
//     value = undefined;
//   }
//   try {
//     arr = this.proto.command(channel, command, value);
//   } catch (err) {
//     return callback(err);
//   }
//   if(this.isHID) {
//     this.device.write(arr);
//     callback();
//   } else {
//     this.device.write(arr, callback);
//   }
// };
//
// Driver.prototype.close = function (callback) {
//   var device = this.device;
//   callback = callback || _.noop;
//   if(!device) { return callback(); }
//   clearInterval(this.timer);
//   device.removeListener('error', this.emitError);
//   if(this.isHID) {
//     this.device.close();
//     callback();
//   } else {
//     this.device.close(callback);
//   }
// };
//
// module.exports = Driver;
