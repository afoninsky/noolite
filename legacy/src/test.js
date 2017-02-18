const protocol = require('./protocol')('mt1132')
const result = protocol.send(1, 'ON', 'qwe')
console.log(result)
