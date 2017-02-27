# noolite
node.js driver for noolite devices

NOTE: this driver is not compatible with previous version, and require node with async/await support

## What is it

[noolite](http://www.noo.com.by/) is a set of IoT devices to control power (lights, etc over 433,92 radio). This driver can send and receive commands using USB sticks and UART device.

## Usage examples

    npm install noolite

```javascript
const createDriver = require('noolight')

const driver = createDriver({
  device: 'pc1132'
})

// dim light on channel #1
;(async () => {
  await driver.open()
  await driver.send(1, 'SET', 100)
  await driver.close()
})()
```

```javascript
const driver = createDriver({
  device: 'rx2164',
  onError: err => {
    throw err
  },
  onData: ({ channel, command, value, raw }) => {
    console.log(`got event on channel ${channel}: ${command} (value=${value})`)
    console.log('raw data:', raw)
  }
})

// open devoce and listen incoming events
driver.open()
```


`OFF`, `START_SMOOTH_DECREASE`, `ON`, `START_SMOOTH_INCREASE`, `SWITCH`, `REVERSE_SMOOTH`, `SET`, `RUN_SCENARIO`, `SAVE_SCENARIO`, `UNBIND`, `STOP_SMOOTH`, `BIND` etc.

Please refer to the module documentation for the extended use. Set of command may be various.

## Hint
To have access on device from common user add rule to udev. For example to /etc/udev/rules.d/50-noolite.rules next line:
ATTRS{idVendor}=="16c0", ATTRS{idProduct}=="05df", SUBSYSTEMS=="usb", ACTION=="add", MODE="0666", GROUP="plugdev"

And add your user to plugdev group:
`sudo usermod <user> -a -G plugdev`


## License

Copyright (c) 2015. Licensed under the Apache 2.0 license.
