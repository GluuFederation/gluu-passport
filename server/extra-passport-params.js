const R = require('ramda')

//Extra params supplied per strategy
//They are not set via oxTrust to keep complexity manageable. These params are not expected to change: admins probably will never have to edit the below

//This is wrapped in a function so params is not evaluated upon module load, only at first usage
const params = R.once(() => [
	{
		strategy: 'passport-saml',
		passportAuthnParams: {},
		options: {
			validateInResponseTo: true,
			requestIdExpirationPeriodMs: 3600000,
			decryptionPvk: global.config.spTLSKey,
			decryptionCert: global.config.spTLSCert
		}
	},
	{
		strategy: 'passport-oxd',
		passportAuthnParams: {
			scope: ['openid', 'email', 'profile']
		},
		options: {}
	},
	{
		strategy: 'passport-dropbox-oauth2',
		passportAuthnParams: {},
		options: {
			apiVersion: '2'
		}
	},
	{
		strategy: 'passport-facebook',
		passportAuthnParams: {
			scope: ['email']
		},
		options: {
			profileFields: ['id', 'username', 'displayName', 'name', 'emails'],
			//TODO: verify
			enableProof: true
		}
	},
	{
		strategy: 'passport-github',
		passportAuthnParams: {
			scope: ['user']
		},
		options: {}
	},
	{
		strategy: 'passport-google-oauth2',
		passportAuthnParams: {
			scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
		},
		options: {}
	},
	{
		strategy: 'passport-linkedin-oauth2',
		passportAuthnParams: {},
		options: {
			scope: ['r_emailaddress', 'r_basicprofile'],
			state: true
		}
	},
	{
		strategy: 'passport-twitter',
		passportAuthnParams: {},
		options: {
			includeEmail: true
		}
	},
	{
		strategy: 'passport-windowslive',
		passportAuthnParams: {
			//TODO: verify
			scope: ['wl.signin', 'wl.basic']
		},
		options: {}
	}
])

function get(strategyId, paramName) {
	//Select the (only) item matching
	let obj = R.find(R.propEq('strategy', strategyId), params())
	return R.defaultTo({}, R.prop(paramName, obj))
}

module.exports = {
	get: get
}
