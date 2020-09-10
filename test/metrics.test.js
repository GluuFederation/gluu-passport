const chai = require('chai')
const assert = chai.assert
const chaiHttp = require('chai-http')
const rewire = require('rewire')
const server = require('../server/app')
const metrics = rewire('../server/utils/metrics.js')
const config = require('config')


const basicConfig = config.get('passportConfig')

const should = chai.Should()
chai.use(chaiHttp)


before(function (done) {

	/**
	 * Wait for server to start (event appStarted) to start tests
	 */
	server.on('appStarted', function() {
		// remember you need --timeout on mocha CLI to be around 20000
		console.log('app started event listened...')
		done()
	})
})



describe('metrics.js unit', () => {
	var promBundle = metrics.__get__('promBundle')
	it('promBundle exists', () => {
		assert.exists(
			promBundle,
			'promBundle is null or undefined'
		)
	})

	it('promBundle should be a function', () => {
		assert.isFunction(
			promBundle,
			'promBundle is not a function!')
	})

	const metricsMiddleware = metrics.__get__('metricsMiddleware')
	it('metricsMiddleware should  not null / undefined', () => {

		assert.exists(
			metricsMiddleware,
			'metricsMiddleware is null or undefined'
		)
	})

	it('metricsMiddleware should be a function', () => {
		assert.isFunction(
			metricsMiddleware,
			'metricsMiddleware is not a function!')
	})

	it('metricsMiddleware should have metrics not null/undef', () => {
		assert.exists(
			metricsMiddleware.metrics,
			'metrics is not defined in metricsMiddleware'
		)
	})

	it ('http request duration seconds exists in metrics', () => {
		assert.exists(
			metricsMiddleware.metrics.http_request_duration_seconds,
			'http request duration seconds DOES NOT exists in metrics!'
		)
	})
})


/**
 * Integration test using localhost (not mocked)
 */
describe('/passport/metrics - metrics endpoint (integration)', ()  => {
	const gluuBasePath = 'http://127.0.0.1:8090'

	// server should be up and running, integration test
	it('Health check - GET /passport/health-check', (done) => {
		chai.request(gluuBasePath)
			.get('/passport/health-check')

			.end((err, res) => {
				res.should.have.status(200)
				done()
			})
	})


	it('GET request should return status code 200', (done) => {
		chai.request(gluuBasePath)
			.get('/passport/metrics')
			.end(function(err, res) {
				res.should.have.status(200)
				done()
			})
	})
})
