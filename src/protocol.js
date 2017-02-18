/**
 * noolite protocol family translator
 * pc11xx_hid, mt1132 - support: .command
 * rx2164 - support: .command, event
 *
 */
const { throwError } = require('./utils')

// list of supported commands (events in case of rx2164)
const txCommands = {
  OFF: 0,
  START_SMOOTH_DECREASE: 1,
  ON: 2,
  START_SMOOTH_INCREASE: 3,
  SWITCH: 4,
  REVERSE_SMOOTH: 5,
  SET: 6,
  RUN_SCENARIO: 7,
  SAVE_SCENARIO: 8,
  UNBIND: 9,
  STOP_SMOOTH: 10,
  BIND: 15,
  START_SMOOTH: 16,
  SWITCH_COLOR: 17,
  SWITCH_MODE: 18,
  SWITCH_SPEED: 19,
  BATTERY: 20,
  SENSOR: 21
}

const txCommandKeys = Object.keys(txCommands)

// rx2164 specific commands
const rxCommands = {
  BIND: 1,
  STOP_BIND: 2,
  UNBIND: 3,
  UNBIND_ALL: 4
}

// max channels, max commands, tx method, rx method
const devices = {
  mt1132: [31, 19, 'mt1132'],
  pc118: [7, 19, 'pc11xx'],
  pc1116: [15, 19, 'pc11xx'],
  pc1132: [31, 19, 'pc11xx'],
  rx2164: [63, 21, 'rx2164Out', 'rx2164In']
}

// mt1132 specific
const mt1132 = {
  START_BYTE: 85,
  STOP_BYTE: 170
}

module.exports = deviceName => {

  const deviceInfo = devices[deviceName] || throwError(new Error(`device ${deviceName} is not supported`))
  const [ maxChannels, /*avaiableSlots*/, internalSendName, internalRecvName ] = deviceInfo
  const deviceMode = 80 // tx mode, repeat command 2 times, 1000bps

  // ensure all arguments are correct
  const parseInput = (channel, command, tx = true) => {
    channel = parseInt(channel, 10);
    if(isNaN(channel) || channel < 0 || channel > maxChannels) {
      throwError(new Error(`invalid channel "${channel}" (range is 0..${maxChannels})`))
    }

    const commands = tx ? txCommands : rxCommands
    const actualCommand = commands[(command || '').toString().toUpperCase()] || throwError(new Error(`invalid command "${command}"`))

    return {
      channel: channel,
      command: actualCommand
    }
  }

  const updateDimPayload = (arr, inputValue, formatAddr, payloadAddr) => {
    const value = Array.isArray(inputValue) ? inputValue : [ inputValue ]

    switch (value.length) {

      case 1: // set common brightness
        const dim = parseInt(value[0], 10)
        if(isNaN(dim) || dim < 35 || dim > 155) {
          throw new Error('please specify correct dim value in range 35..155')
        }
        return arr[payloadAddr] = dim

      case 3: // set brightness on rgb channels
        const stop = payloadAddr + value.length - 1
        for(let i = payloadAddr; i <= stop; i++) {
          const rgb = parseInt(value[i - payloadAddr], 10)
          if (isNaN(rgb) || rgb < 0 || rgb > 255) {
            throw new Error('please specify correct array like [255, 255, 255]')
          }
          arr[i] = rgb
        }
        return arr[formatAddr] = 3

      default:
        throw new Error('incorrect value (integer or 3-dim array of integers expected)')

    }
  }

  // device-specific packet creation
  const specification = {

    // create packet for mt1132 device
    // http://www.noo.com.by/assets/files/PDF/MT1132.pdf
    mt1132: (channel, command, value) => {
      const arr = [ mt1132.START_BYTE, deviceMode, command, 0, 0, channel, 0, 0, 0, 0, 0, mt1132.STOP_BYTE ]

      if(command === txCommands.SET) {
        updateDimPayload(arr, value, 3, 6)
      } else if (command >= txCommands.START_SMOOTH) {
        arr[3] = 4
      }

      arr[10] = arr.slice(0, 10).reduce((a, b) => a + b) & 0xFF // checksum
      return arr
    },

    // create packet for pc11xx devices
    // http://www.noo.com.by/assets/files/software/PC11xx_HID_API.pdf
    pc11xx: (channel, command, value) => {
      // mode, command, format, 0, channel, r, g, b
      const arr = [ deviceMode, command, 0, 0, channel, 0, 0, 0 ]

      if(command === txCommands.SET) {
        updateDimPayload(arr, value, 2, 5)
      } else if (command >= txCommands.START_SMOOTH) {
        arr[2] = 4
      }
      return arr
    },

  // http://www.noo.com.by/assets/files/software/RX2164_HID_API.pdf
    rx2164Out: (channel, command) => {
      return [ command, channel, 0, 0, 0, 0, 0, 0 ]
    },

    // http://www.noo.com.by/assets/files/software/RX2164_HID_API.pdf
    rx2164In: arr => {
      const data = {
        state: arr[0] & 63,
        isBinding: !!(arr[0] & 64),
        channel: arr[1],
        command: txCommandKeys[arr[2]],
        commandNumeric: arr[2]
      }

      if(arr[3]) {
        data.value = []
        for(let i = 4, end = i + arr[3]; i < end; i++) {
          data.value.push(arr[i])
        }
      }
      return data
    }

  }

  return {

    // translate readable command to array of bytes (write to device)
    send: (...params) => {
      const [ inputChannel, inputCommand, value ] = params
      const { channel, command } = parseInput(inputChannel, inputCommand, internalSendName !== 'rx2164Out')
      return specification[internalSendName](channel, command, value) || throwError(new Error('.send is not supported by this device'))
    },

    // translate array of bytes into event (readed from device)
    recv: (...params) => {
      return specification[internalRecvName](...params) || throwError(new Error('.recv is not supported by this device'))
    }
  }
}
