/*
 * noolite (http://www.noo.com.by) device support
 * work with HID(usb) devices - pc11xx (tx), rx2164 (tx/rx)
 * and UART devices - mt1132 (tx)
 *
 */

const SerialPort = require('serialport')
const { HID } = require('node-hid')
const Promise = require('bluebird')
const { createProtocol } = require('./protocol')

const usbDevices = ['pc118', 'pc1116', 'pc1132', 'rx2164']

const defaultConfig = {
  device: null,         // device name
  port: '/dev/ttyAMA0', // mt1132: default port
  vid: 5824,            // pc11xx_hid, rx2164: HID vendor id
  pid: null,            // pc11xx_hid, rx2164: HID product id
  readInterval: 200,
  onError: null,
  onData: null
}


const createDriver = (userConfig = {}) => {
  const config = Object.assign({}, defaultConfig, userConfig)

  const proto = createProtocol(config.device)
  const isHID = usbDevices.includes(config.device)

  let lastState, timer, device

  if (isHID && !config.pid) {
    config.pid = config.device === 'rx2164' ? 1500 : 1503
  }

  const publicMethods = {}

  const emitError = err => {
    if (config.onError) {
      return config.onError(err)
    } else {
      throw err
    }
  }


  const readData = () => {
    // have no idea why we can read from rx2164 using .getFeatureReport but can't using .read
    const buffer = device.getFeatureReport(0xf2, 17)
    const result = proto.recv(buffer)
    if (result.state !== lastState) {
      lastState = result.state
      config.onData(result)
    }
  }

  publicMethods.open = callback => {

    const cb = err => {
      if (!err) {
        if (proto.recv) { // able to read events from device
          device.setNonBlocking(1)
          const buffer = device.getFeatureReport(0xf2, 17)
          const { state } = proto.recv(buffer)
          lastState = state
          timer = setInterval(readData, config.readInterval);
        }
      } else {
        device.removeListener('error', emitError)
      }
      callback(err)
    }

    if (isHID) { // usb device
      try {
        device = new HID(config.vid, config.pid)
        device.on('error', emitError)
      } catch (err) {
        return cb(err)
      }
      return cb()
    }

    device = new SerialPort(config.port, { // serial device
      baudrate: 9600
    })

    device.once('open', cb)
    device.on('error', emitError)
    device.open(err => {
      if (err) {
        device.removeListener('open', cb)
        cb(err)
      }
    })
  }

  publicMethods.close = callback => {
    const cb = callback || function () {}
    if (!device) { return cb() }
    clearInterval(timer)
    device.removeListener('error', emitError);

    if (isHID) {
    device.close()
    callback()
    } else {
      device.close(callback)
    }
  }

  publicMethods.send = (channel, command, value, callback) => {

    let arr
    if (typeof value === 'function') {
      callback = value;
      value = undefined;
    }
    try {
      arr = proto.send(channel, command, value)
    } catch (err) {
      return callback(err)
    }

    if (isHID) {
      device.write(arr)
      callback()
    } else {
      device.write(arr, callback)
    }
  }

  const promisifiedMethods = {}
  for (let name in publicMethods) {
    promisifiedMethods[name] = Promise.promisify(publicMethods[name])
  }
  return promisifiedMethods
}

module.exports = { createDriver }
