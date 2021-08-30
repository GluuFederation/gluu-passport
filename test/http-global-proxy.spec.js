const chai = require('chai')
const config = require('config')
const http = require('http')

const assert = chai.assert
const HTTP_PROXY = config.get('HTTP_PROXY')
const NO_PROXY = config.get('NO_PROXY')

describe('global agent proxy setup', () => {
  it('global agent object should have global agent', async () => {
    assert.exists(global.GLOBAL_AGENT)
  })

  it('global agent object should have http proxy settings', () => {
    assert.exists(global.GLOBAL_AGENT.HTTP_PROXY)
  })

  it('global agent object config should match with app proxy configs', () => {
    assert.equal(global.GLOBAL_AGENT.HTTP_PROXY, HTTP_PROXY)
    assert.equal(global.GLOBAL_AGENT.NO_PROXY, NO_PROXY)
  })

  let proxySetting = null
  it('http object should have global agent proxy details', async () => {
    assert.exists(http.globalAgent)
    proxySetting = http.globalAgent.getUrlProxy()
    assert.exists(proxySetting)
  })

  it("http object's global agent proxy details should match with app proxy config", () => {
    const proxyURL = new URL(HTTP_PROXY)
    assert.equal(proxySetting.hostname, proxyURL.hostname)
    assert.equal(proxySetting.port, proxyURL.port)
  })
})
