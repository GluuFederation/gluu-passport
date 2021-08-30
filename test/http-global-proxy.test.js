const chai = require('chai')
const config = require('config')
const rewire = require('rewire')

const assert = chai.assert
const HTTP_PROXY = config.get('HTTP_PROXY')
const NO_PROXY = config.get('NO_PROXY')

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
  })

  it('global agent object should have http proxy settings', () => {
    assert.exists(global.GLOBAL_AGENT.HTTP_PROXY)
  })

  it('global agent object config should match with app proxy configs', () => {
    assert.equal(global.GLOBAL_AGENT.HTTP_PROXY, HTTP_PROXY)
    assert.equal(global.GLOBAL_AGENT.NO_PROXY, NO_PROXY)
  })
})
