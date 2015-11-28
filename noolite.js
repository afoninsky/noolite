#!/usr/bin/env node
'use strict';

var Driver = require('./');
var proto = require('./src/proto');
var readline = require('readline');

var device = process.argv[2];
if(!device || proto.devices.indexOf(device) === -1) {
  console.log('Usage: noolite <device> (ex: '+proto.devices.join(', ')+')');
  process.exit();
}
var driver = new Driver({
  device: device
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: function (line) {
    var items = Object.keys(driver.proto.commands);
    items.push('channel');

    var hits = items.map(function (item) {
      return item.toLowerCase();
    }).filter(function (item) {
      return item.indexOf(line) === 0;
    });
    return [hits.length ? hits : items, line];
  }
});

driver.openAsync().then(function () {

  driver.on('data', function (channel, command) {
    console.log(' EVENT ----> channel=%s, command=%s', channel, command);
    rl.prompt(true);
  });

  var channel = null;

  function setChannel(_channel) {
    channel = _channel;
    rl.setPrompt('['+channel+']> ');
  }

  setChannel(0);
  rl.prompt(true);

  rl.on('line', function(line) {
    var items = line.trim().split(' ');
    switch(items[0]) {
      case '':
        rl.prompt(true);
        break;

      case 'channel':
        setChannel(parseInt(items[1], 10));
        rl.prompt(true);
        break;

      default:
        var arg = [channel, items[0].toUpperCase()],
          value = items.slice(1).map(function (item) {
            return parseInt(item, 10);
          });
        if(value) { arg.push(value); }

        arg.push(function (err) {
          if(err) {
            console.log('ERROR:', err.message);
          }
          rl.prompt(true);
        });

        driver.send.apply(driver, arg);
        break;
    }
  });

  rl.on('close', function() {
    driver.close();
    console.log('');
  });

});
