const
	redis = require('redis'),
	Memcached = require('memcached'),
	Promise = require('bluebird'),
	R = require('ramda'),
	logger = require('./utils/logging'),
	OPERATION_NO_CONN = 'Attempt to operate on cache provider but connection has not been established'

const promisify = (context, methodName) => Promise.promisify(context[methodName], { context: context })

function getRedisProvider(options, exp) {

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
				setAsync(key, value, 'EX', exp)
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

function getMemcachedProvider(options, exp) {

	logger.log2('info', 'Configuring memcached provider for inResponseTo validation')
	let memcached = new Memcached(options.server_locations, options.options),
		getAsync = promisify(memcached, 'get'),
		setAsync = promisify(memcached, 'set'),
		delAsync = promisify(memcached, 'del')

	return {
		save: function(key, value, cb) {
			setAsync(key, value, exp)
					.then(_ => cb(null, value))
					.catch(err => cb(err, null))
		},
		get: function(key, cb) {
			getAsync(key)
				.then(value => cb(null, value))
				.catch(err => cb(err, null))
		},
		remove: function(key, cb) {
			delAsync(key)
				.then(_ => cb(null, key))
				.catch(err => cb(err, null))
		}
	}

}

function get(type, options, expiration) {

	if (type == 'redis') {
		return getRedisProvider(options, expiration)
	} else if (type == 'memcached') {
		return getMemcachedProvider(options, expiration)
	} else {
		logger.log2('warn', `Unknown cache provider ${type}`)
		return null
	}

}

module.exports = {
	get: get
}
