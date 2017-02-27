const { createDriver } = require('./driver')

const driver = createDriver({
  device: 'pc1132'
})

driver.open().then(() => {
  console.log('>', process.argv[2], process.argv[3], process.argv[4])
  return driver.send(process.argv[2], process.argv[3], process.argv[4])
}).then(console.log)

// const driver = createDriver({
//   device: 'rx2164',
//   onError: console.log,
//   onData: console.log
// })
//
// driver.open().then(() => {
//   // return driver.send(1, 'OFF')
// }).then(console.log)
//
