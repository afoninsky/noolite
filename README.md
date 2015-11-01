# noolite-uart
node.js driver for МТ1132 transmitter

## What is it

[noolite](http://www.noo.com.by/) is a set of IoT devices to control power (lights, etc over 433,92 radio). One of it components - [МТ1132 module](http://www.noo.com.by/assets/files/PDF/MT1132.pdf), give ability to transmit commands over UART bus (raspberry, arduino etc). This piece of software can be used to communicate with МТ1132 by sending commands to serial port.

## How to Use

```javascript
'use strict';
Noolite = require('noolite-uart');

// create driver instance
driver = new Noolite({
  port: '/dev/ttyAMA0', // serial port
  txTimeout: 500        // set to 'false' if RX pin not connected
});

driver.open(function (err) {
  // sent command 'turn on the light' to first associated device
  driver.send(0, 'ON', function () {
    console.log('command sent');
    // disconnect
    driver.serial.close();
  })
});

```

Promises can be used also:
```javascript
...
driver.openAsync().then(function() {
  driver.sendAsync(1, 'SWITCH');
});
...
```

## Client interface
You can send command directly from command line

    $ ./cli
    [0]>
    off                    start_smooth_decrease  on                     start_smooth_increase  switch
    reverse_smooth         set                    run_scenario           save_scenario          unbind
    stop_smooth            bind                   channel

    [0]> channel 1 # switch to device #2
    [1]> on # send command 'turn on the light'
    [1]> off # send command 'turn off the light'


## Available commands

`OFF`, `START_SMOOTH_DECREASE`, `ON`, `START_SMOOTH_INCREASE`, `SWITCH`, `REVERSE_SMOOTH`, `SET`, `RUN_SCENARIO`, `SAVE_SCENARIO`, `UNBIND`, `STOP_SMOOTH`, `BIND`

Please refer to the module documentation for the extended use.

## License

Copyright (c) 2015. Licensed under the Apache 2.0 license.
