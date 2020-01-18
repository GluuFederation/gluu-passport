const
	R = require('ramda'),
	sha1 = require('sha1'),
	jwt = require('jsonwebtoken'),
	crypto = require('crypto'),
	fs = require('fs')

const isObject = x => !R.isNil(x) && !Array.isArray(x) && typeof x == 'object'

const pipePromise_ = R.reduce( (p,fn) => Promise.resolve(p).then(fn) )

/**
 * @sig (a -> Promise b, b -> Promise c, ...) -> (a -> Promise z)
 */
const pipePromise = R.pipe(R.unapply(R.flatten), R.flip(pipePromise_))

const curry2AndFlip = R.pipe(R.curryN(2), R.flip)

const hash = obj => sha1(JSON.stringify(obj))

function pathsHaveData(list, obj) {
	let pred = R.pathSatisfies(R.anyPass([R.isNil, R.isEmpty]))
	pred = R.anyPass(R.map(pred, list))
	return !pred(obj)
}

const hasData = (list, obj) => pathsHaveData(R.map(x => [x], list), obj)

const privateKey = R.once(() =>
			fs.readFileSync(global.basicConfig.keyPath, 'utf8')
			.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----")
			.replace("-----END RSA PRIVATE KEY-----", "-----END PRIVATE KEY-----"))

const defaultRpOptions = R.once(() => ({
				algorithm: global.basicConfig.keyAlg,
				header: {
					typ: "JWT",
					alg: global.basicConfig.keyAlg,
					kid: global.basicConfig.keyId
				}
			}))

const secretKey = R.once(() => {
							let salt = fs.readFileSync("/etc/gluu/conf/salt", 'utf8')
							return /=\s*(\S+)/.exec(salt)[1]
						})

const getRpJWT = payload => jwt.sign(payload, privateKey(), defaultRpOptions())

const getJWT = (payload, expSec) => jwt.sign(payload, secretKey(), { expiresIn: expSec })

const verifyJWT = token => jwt.verify(token, secretKey())

function arrify(obj) {
	/*
		This functions aims at transforming every key value of an object in the following way:

		"" --> []
		"hi" --> ["hi"]
		["hi", "there"] --> ["hi", "there"]
		[{"attr":"hi"}, {"attr":"there"}] --> ['{"attr":"hi"}', '{"attr":"there"}']
		{"attr":"hi"} --> ['{"attr":"hi"}']
		[] --> []
		null --> []
		undefined --> []

		Object members which are functions are dropped
	*/

	//Implementing this in imperative style ends up in a very funny stair-like code
	let isBasicType = R.flip(R.includes)(['boolean', 'number', 'string']),
		f = R.ifElse(x => isBasicType(typeof x[0]), R.identity, x => R.map(val => JSON.stringify(val), x)),
		g = R.ifElse(Array.isArray, f, x => [x]),
		h = R.ifElse(isObject, x => [JSON.stringify(x)], g),
		k = R.ifElse(R.anyPass([R.isNil, R.isEmpty]), x => [], h)

	obj = R.filter(v => typeof(v) != 'function', obj)
	return R.map(k, obj)

}

function encrypt(obj) {

	//Encryption compatible with Gluu EncryptionService
	let pt = JSON.stringify(obj)
	let encrypt = crypto.createCipheriv('des-ede3-ecb', secretKey(), "")
	var encrypted = encrypt.update(pt, 'utf8', 'base64')
	encrypted += encrypt.final('base64')
	return encrypted

}

module.exports = {
	isObject: isObject,
	hash: hash,
	pathsHaveData: pathsHaveData,
	hasData: hasData,
	pipePromise: pipePromise,
	curry2AndFlip: curry2AndFlip,
	arrify: arrify,
	getRpJWT: getRpJWT,
	getJWT: getJWT,
	verifyJWT: verifyJWT,
	encrypt: encrypt
}
