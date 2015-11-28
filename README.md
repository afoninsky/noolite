# noolite
node.js driver for noolite devices

## What is it

[noolite](http://www.noo.com.by/) is a set of IoT devices to control power (lights, etc over 433,92 radio). This driver can send and receive commands using USB sticks and UART device.

## API

##### new Driver( {device: deviceName })
Create driver instance.

##### .open(callback)
##### .openAsync() `promise`
Open device and start work. Device now able to receive and send data.

##### .send(channel, command, value, callback)
##### .send(channel, command, callback)
##### .sendAsync(channel, command, value, callback) `promise`
##### .sendAsync(channel, command, callback) `promise`

Send command to specified channel. Send payload if command support it.

##### .close(callback)
##### .closeAsync() `promise`
Close device and stop receiving events

#### .on('error', function (err) { ... })
Handle error

#### .on('data', function (channel, command) { ... })
Receive incoming message. rx2164 only.


## Usage example

```javascript
'use strict';
Noolite = require('noolite');

// create driver instance
var driver = new Noolite({
  device: 'pc1132' // supported: mt1132, pc118, pc1116, pc1132, rx2164
});

driver.open(function (err) {
  // sent command 'turn on the light' to first associated device
  driver.send(0, 'ON', function () {
    console.log('command sent');
    driver.close();
  });
});
```

## Client interface
You can send command directly from command line

    $ ./noolite.js
    [0]>
    off                    start_smooth_decrease  on                     start_smooth_increase  switch
    reverse_smooth         set                    run_scenario           save_scenario          unbind
    stop_smooth            bind                   channel

    [0]> channel 1
    [1]> on
    [1]> off
    [1]> set 100


## Available commands


`OFF`, `START_SMOOTH_DECREASE`, `ON`, `START_SMOOTH_INCREASE`, `SWITCH`, `REVERSE_SMOOTH`, `SET`, `RUN_SCENARIO`, `SAVE_SCENARIO`, `UNBIND`, `STOP_SMOOTH`, `BIND` etc.

Please refer to the module documentation for the extended use. Set of command may be various.

## License

Copyright (c) 2015. Licensed under the Apache 2.0 license.
