const { Given, When, Then, BeforeAll } = require('cucumber')
const got = require('got')
const chai = require('chai')
const assert = chai.assert
const helper = require('../../helper')

BeforeAll({ timeout: 600 * 1000 }, (done) => {
  helper.setupServer()
    .then(() => done())
})

Given('passport server is up and running', async () => {
  const response = await got('http://127.0.0.1:8090/passport/health-check')
  assert.equal(response.statusCode, 200,
    'response.statusCode is NOT 200')
})

When('my aggregator access metrics endpoint', async () => {
  const response = await got('http://127.0.0.1:8090/passport/metrics')
  assert.isNotNull(response)
})

Then('should return me the metrics', async () => {
  const response = await got('http://127.0.0.1:8090/passport/metrics')
  assert.propertyVal(response.headers, 'content-type', 'text/plain')
})

Given(
  'I access an {string} {int} times',
  async function (endpoint, numberOfTimes) {
    let counter = 0
    while (counter < numberOfTimes) {
      try {
        await got(`http://127.0.0.1:8090${endpoint}`, { throwHttpErrors: false })
      } catch (err) {
        // empty block for errors status code (i.e. 404)
      }

      counter++
    }
  })

Then(
  '{string} count should be {int}',
  async function (endpointAlias, numberOfTimes) {
    const response = await got('http://127.0.0.1:8090/passport/metrics')
    const body = response.body
    const pattern = new RegExp(
      `http_request_duration_seconds_count{status_code="\\d+",method="GET",path="${endpointAlias}.*`
    )
    const startIndex = body.search(pattern)
    const lineEndIndex = body.substring(startIndex).search('\n')
    const textLine = body.substr(startIndex, lineEndIndex)
    const lastSpaceIndex = textLine.lastIndexOf(' ')

    // after space is count number
    const countNumber = parseInt(textLine.substring(lastSpaceIndex + 1), 10)
    assert.equal(countNumber, numberOfTimes)
  })
