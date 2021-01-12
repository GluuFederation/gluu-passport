const { Given, When, Then, AfterStep, BeforeStep } = require('@cucumber/cucumber')
const chai = require('chai')
const config = require('config')
const assert = chai.assert
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
let app
let requester
require('events').defaultMaxListeners = 100

BeforeStep(async () => {
  app = require('../../../server/app')
  await app.on('appStarted', () => {
    console.log('app started...')
  })
  requester = chai.request(app).keepOpen()
  await app.rateLimiter.resetKey('::ffff:127.0.0.1')
})

AfterStep(async () => {
  await requester.close()
})

Given('configured rate limit is 100 requests in 86400000 ms', async () => {
  // check if config file has 100 and 86400000
  assert.equal(config.get('rateLimitMaxRequestAllow'), 100)
  assert.equal(config.get('rateLimitWindowMs'), 86400000)
})

When('{string} is requested {int} times in less then 86400000 ms by the same client', async (endpoint, requestsCount) => {
  for (let i = 1; i <= requestsCount; i++) {
    this.lastResponse = await requester.get(`/passport${endpoint}`)
  }
})

Then('last request response should have status code {int}', async (responseStatusCode) => {
  assert.equal(this.lastResponse.statusCode, responseStatusCode,
    `response.statusCode is NOT ${responseStatusCode}`)
})

Then('response body should be "{string}"', async (responseBody) => {
  assert.equal(this.lastResponse.text, responseBody)
})
