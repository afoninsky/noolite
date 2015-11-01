'use strict';

var sinon = require('sinon');
var SerialPort = require('serialport').SerialPort;
var chai = require('chai');
var expect = chai.expect;

var _err;
sinon.stub(SerialPort.prototype, 'open', function(callback) {
  callback(_err);
  _err = null;
});

sinon.stub(SerialPort.prototype, 'write', function(arr, callback) {
  callback(null, arr.length);
  this.emit('data', 'OK\r\n');
});

sinon.stub(SerialPort.prototype, 'drain', function(callback) {
  callback();
});

var Driver = require('../');
describe('driver', function () {

  var driver;

  it('create instance with custom mode', function () {
    driver = new Driver({
      mode: 100
    });
  });

  it('create instance', function () {
    driver = new Driver();
  });

  it('connect failed', function (done) {
    _err = new Error('test');
    driver.open(function (err) {
      expect(err).to.be.a.instanceof(Error);
      done();
    });
  });

  it('connect to serial port', function () {
    driver.openAsync();
  });

  it('send wrong command', function (done) {
    driver.send(1, 'FAIL', function (err) {
      expect(err).to.be.a.instanceof(Error);
      done();
    });
  });

  it('send into wrong channel', function (done) {
    driver.send(100, 'ON', function (err) {
      expect(err).to.be.a.instanceof(Error);
      done();
    });
  });

  it('send simple command', function (done) {
    driver.sendAsync(1, 'ON').then(function () {
      done();
    }).catch(done);
  });

  it('send command with payload', function (done) {
    driver.sendAsync(0, 'SET', {
      brightness: [0, 0, 0]
    }).then(function () {
      done();
    }).catch(done);
  });

  it('send command without RX pin disconnected', function (done) {
    driver.cfg.txTimeout = false;
    driver.sendAsync(1, 'ON').then(function () {
      done();
    }).catch(done);
  });

  //
  // it('', function () {});
  // it('', function () {});
  // it('', function () {});

});
