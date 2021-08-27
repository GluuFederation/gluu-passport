const chai = require('chai')
const config = require('config')
const http = require('http')

const assert = chai.assert
const HTTP_PROXY = config.get('HTTP_PROXY')
const NO_PROXY = config.get('NO_PROXY')

describe('global agent proxy setup', () => {
  it('node global object should have global agent and proxy setup', async () => {
    assert.exists(global.GLOBAL_AGENT)
    assert.exists(global.GLOBAL_AGENT.HTTP_PROXY)
    assert.equal(global.GLOBAL_AGENT.HTTP_PROXY, HTTP_PROXY)
    assert.equal(global.GLOBAL_AGENT.NO_PROXY, NO_PROXY)
  })

  it('http object should have global agent and proxy setup', async () => {
    assert.exists(http.globalAgent)
    const proxySetting = http.globalAgent.getUrlProxy()
    console.log(proxySetting)
    assert.exists(proxySetting)
    const proxyURL = new URL(HTTP_PROXY)
    assert.equal(proxySetting.hostname, proxyURL.hostname)
    assert.equal(proxySetting.port, proxyURL.port)
  })
})
