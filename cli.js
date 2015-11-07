#!/usr/bin/env node
'use strict';

var Driver = require('./');
var readline = require('readline');

var driver = new Driver({
  port: process.argv[2],
  txTimeout: false
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: function (line) {
    var items = Object.keys(Driver.commands);
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
      var param = {
          command: items[0].toUpperCase(),
          value: items.slice(1).map(function (item) {
            return parseInt(item, 10);
          })
        }

      driver.sendAsync(channel, param, function (err) {
        if(err) {
          console.log('ERROR:', err.message);
        }
        rl.prompt(true);
      });
      break;
    }
  });

  rl.on('close', function() {
    if(driver.serial.isOpen()) {
      driver.serial.close();
    }
    console.log('');
  });

});
