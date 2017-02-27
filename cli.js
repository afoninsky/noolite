#!/usr/bin/env node

if (process.argv.length < 5) {
  console.log('Usage: ./cli.js <device> <channel> <command> [payload]')
  console.log('')
  process.exit()
}
const driver = require('./')({
  device: process.argv[2],
  onData: console.log
})


driver.open().then(() => {
  return driver.send(process.argv[3], process.argv[4], process.argv[5])
}).then(() => {
  console.log('sent:', process.argv[3], process.argv[4], process.argv[5] ? process.argv[5] : '')
})
