const chai = require('chai')
const config = require('config')
const rewire = require('rewire')

const assert = chai.assert
const HTTP_PROXY = config.get('HTTP_PROXY')

describe('global agent proxy setup', () => {
  before(() => {
    global.GLOBAL_AGENT = null
  })

  it('node global object should not have proxy config', async () => {
    assert.notExists(global.GLOBAL_AGENT)
  })

  it('node global object should have global agent and proxy setup', async () => {
    rewire('../server/utils/http-global-proxy')
    assert.exists(global.GLOBAL_AGENT)
    assert.exists(global.GLOBAL_AGENT.HTTP_PROXY)
    assert.equal(global.GLOBAL_AGENT.HTTP_PROXY, HTTP_PROXY)
  })
})
