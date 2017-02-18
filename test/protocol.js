// node --harmony_async_await node_modules/.bin/ava src/micro/fulltext/tests.js

import { describe } from 'ava-spec'
import { createProtocol } from '../src/protocol'

describe('mt1132', it => {


  it.beforeEach(t => {
    t.context = createProtocol('mt1132')
  })

  it('send ON', t => {
    const buffer = t.context.send(2, 'ON')
    t.deepEqual(buffer, [ 85, 80, 2, 0, 0, 2, 0, 0, 0, 0, 169, 170 ])
  })

})
