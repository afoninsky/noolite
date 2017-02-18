/*
 * noolite (http://www.noo.com.by) device support
 * work with HID(usb) devices - pc11xx (tx), rx2164 (tx/rx)
 * and UART devices - mt1132 (tx)
 *
 */

const SerialPort = require('serialport')
const { HID } = require('node-hid')
const Promise = require('bluebird')
const { EventEmitter } = require('events')
const { inherits } = require('util')

const { devices, createProtocol } = require('./protocol')
const { throwError } = require('./utils')

const usbDevices = ['pc118', 'pc1116', 'pc1132', 'rx2164']

const defaultConfig = {
    device: null,         // device name
    port: '/dev/ttyAMA0', // mt1132: default port
    vid: 5824,            // pc11xx_hid, rx2164: HID vendor id
    pid: null,            // pc11xx_hid, rx2164: HID product id
    readInterval: 200,
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
  inherits(publicMethods, EventEmitter)

  const emitError = err => {
    publicMethods.emit('error', err)
  }


  const readData = () => {
    // have no idea why we can read from rx2164 using .getFeatureReport but can't using .read
    const buffer = device.getFeatureReport(0xf2, 17)
    const { state, channel, command } = proto.recv(buffer)
    if (state !== lastState) {
      lastState = state
      publicMethods.emit('data', channel, command)
    }
  }

  publicMethods.open = callback => {

    const cb = err => {
      if (!err) {
        device.on('error', emitError)
        if (proto.recv) { // able to read events from device
          device.setNonBlocking(1)
          const buffer = device.getFeatureReport(0xf2, 17)
          const { state } = proto.recv(buffer)
          lastState = state
          timer = setInterval(readData, config.readInterval);
        }
      }
      callback(err)
    }

    if (isHID) { // usb device
      try {
        device = new HID(config.vid, config.pid)
      } catch (err) {
        return cb(err)
      }
      return cb()
    }

    device = new SerialPort(cfg.port, { // serial device
      baudrate: 9600
    })

    device.once('open', cb)
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

  return Promise.promisify(publicMethods)
}

module.exports = { createDriver }
