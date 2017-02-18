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
  onError: console.log,
  onData: console.log
})

driver.open().then(() => {
  console.log('opened')
  // return driver.send(1, 'OFF')
}).then(console.log)

