const { createDriver } = require('./driver')

// const driver = createDriver({
//   device: 'pc1132'
// })
//
// driver.open().then(() => {
//   return driver.send(1, 'OFF')
// }).then(console.log)

const driver = createDriver({
  device: 'rx2164',
  onError: err => {
    console.log('got err')
    throw err
  },
  onData: ({ channel, command, value, raw }) => {
    console.log(`got event on channel ${channel}: ${command} (value=${value})`)
    console.log('raw data:', raw)
    // [ 38, 2, 21, 3, 17, 17, 0, 255 ] - temp
    // [ 169, 2, 21, 3, 5, 17, 0, 255 ]
    if (channel === 2 && command === 'SENSOR') {
      const [ d1, d2, d3 ] = value

    }
  }
})

driver.open().then(() => {
  if (process.argv[2]) {
    console.log('>', process.argv[2], process.argv[3])
    return driver.send(process.argv[2], process.argv[3])
  }
})
