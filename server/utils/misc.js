var fs = require('fs')
var jwt = require('jsonwebtoken')

var privateKey;

function getJWT(payload) {

	var options = {
	        algorithm: global.config.keyAlg,
	        header: {
	            "typ": "JWT",
	            "alg": global.config.keyAlg,
	            "kid": global.config.keyId
	        }
    }
    return jwt.sign(payload, privateKey, options)

}

function getPrivateKey() {
	// get private key and replace headers to sign jwt
	return fs.readFileSync(global.config.keyPath, 'utf8')
			.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----")
			.replace("-----END RSA PRIVATE KEY-----", "-----END PRIVATE KEY-----")
}

module.exports = () => {
		 if (!privateKey) {
			 privateKey = getPrivateKey()
		 }
		 return module.exports;
	}

module.exports.getJWT = getJWT