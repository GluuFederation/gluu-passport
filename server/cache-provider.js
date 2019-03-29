const
	//redis = require('redis'),
	Promise = require('bluebird'),
	R = require('ramda'),
	logger = require('./utils/logging'),
	OPERATION_NO_CONN = 'Attempt to operate on cache provider but connection has not been established'

const promisify = (context, methodName) => Promise.promisify(context[methodName], { context: context })

function get(options) {

	logger.log2('info', 'Configuring redis cache provider for inResponseTo validation')
	options = R.mergeLeft(options, { max_attempts: 3 })

	let	ready = false,
		client = redis.createClient(options),
		getAsync = promisify(client, 'get'),
		setAsync = promisify(client, 'set'),
		delAsync = promisify(client, 'del')

	client.on('ready', () => {
		ready = true
		let host = options.host,
			port = options.port,
			msg = host && port ? `${host}:${port}` : ''
		logger.log2('info', `Redis client has connected to server ${msg}`)
	})
	client.on("error", err => logger.log2('error', err))
	client.on("end", _ => ready = false)

	return {
		save: function(key, value, cb) {
			if (ready) {
				setAsync(key, value)
					.then(_ => cb(null, value))
					.catch(err => cb(err, null))
			} else {
				logger.log2('warn', OPERATION_NO_CONN)
			}
		},
		get: function(key, cb) {
			if (ready) {
				getAsync(key)
					.then(value => cb(null, value))
					.catch(err => cb(err, null))
			} else {
				logger.log2('warn', OPERATION_NO_CONN)
			}
		},
		remove: function(key, cb) {
			if (ready) {
				delAsync(key)
					.then(res => cb(null, res == 0 ? null : key))
					.catch(err => cb(err, null))
			} else {
				logger.log2('warn', OPERATION_NO_CONN)
			}
		}
	}
}

module.exports = {
	get: get
}
