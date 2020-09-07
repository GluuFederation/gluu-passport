const { Given, When, Then, AfterAll, BeforeAll } = require('cucumber')
const got = require('got')
const server = require('../../../server/app')
const chai = require('chai')
const assert = chai.assert

BeforeAll( {timeout: 600 * 1000}, (done) => {
	// perform some shared setup
	server.on('appStarted', () => {
		console.log('FINALLY STARTED! FINALLYU!!!')
		done()
	})
})




Given('passport server is up and running', async () => {
	// Write code here that turns the phrase above into concrete actions
	const response = await got('http://127.0.0.1:8090/passport/health-check')
	assert.equal(response.statusCode, 200,
		'response.statusCode is NOT 200')
})


When('my aggregator access metrics endpoint', async () => {
	const response = await got('http://127.0.0.1:8090/passport/metrics')
	// Write code here that turns the phrase above into concrete actions
	assert.isNotNull(response)
})

Then('should return me the metrics', async () => {
	// Write code here that turns the phrase above into concrete actions
	const response = await got('http://127.0.0.1:8090/passport/metrics')
	assert.propertyVal(response.headers, 'content-type','text/plain')
})


Given(
	'I access an {string} {int} times',
	async function (endpoint, numberOfTimes) {
		let counter = 0
		while(counter < numberOfTimes) {
			// const fullUrl = `http://127.0.0.1:8090${endpoint}`
			// assert('http://127.0.0.1:8090/passport/token' === fullUrl, fullUrl)
			try {
				const response = await got(`http://127.0.0.1:8090${endpoint}`,{throwHttpErrors: false})
			} catch(err) {
				console.log("ERROR:")
				console.log(err)
			}
			// console.log(response.statusCode)
			//assert.exists(response.statusCode)
			counter++
		}
	})


Then(
	'{string} count should be {int}',
	async function (endpointAlias, numberOfTimes) {
		const response = await got('http://127.0.0.1/passport/metrics')
		const body = response.body
		const pattern = new RegExp(
			`http_request_duration_seconds_count{status_code="\\d+",method="GET",path="${endpointAlias}.*`
		)
		const startIndex = body.search(pattern)
		const lineEndIndex = body.substring(startIndex).search('\n')
		const textLine = body.substr(startIndex, lineEndIndex)
		console.log(textLine)
		const lastSpaceIndex = textLine.lastIndexOf(' ')

		// after space is count number
		const countNumber = parseInt(textLine.substring(lastSpaceIndex+1),10)
		assert.equal(countNumber, numberOfTimes)
	})
