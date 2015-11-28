'use strict';

var expect = require('chai').expect;
var Driver = require('../');

describe('driver', function () {

  var driver;

  it('call unsupported device', function () {
    expect(function () {
      new Driver({ device: 'no such' });
    }).to.throw();
  });

  it('create test instance', function () {
    driver = new Driver({
      device: 'rx2164',
      debug: true
    });
  });

  it('open device', function () {
    driver.openAsync();
  });

  it('send some data', function () {
    driver.sendAsync(0, 'SWITCH');
  });

  it('close device', function () {
    driver.closeAsync();
  });

});
