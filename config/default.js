const fs = require('fs')

const passportConfigFileData = {
	configurationEndpoint: "https://chris.gluuthree.org/identity/restv1/passport/config",
	failureRedirectUrl: "https://chris.gluuthree.org/oxauth/auth/passport/passportlogin.htm",
	logLevel: "debug",
	consoleLogOnly: false,
	clientId: "1502.3fe76d0a-38dd-4f91-830b-e33fd70d778a",
	keyPath: "/tmp/passport-rp.pem",
	keyId: "fbc267ef-0705-4b3a-8c80-bf70e75cf08b_sig_rs512",
	keyAlg: "RS512"
}

/**
 * Gets the default passport configuration file path.
 * If file doesn't exists, creates it and return path
 * @returns {string} passport-config.json file path
 */
function passportConfigFilePath() {
	let passportFilePath = '/opt/gluu-server/etc/gluu/'+
		'conf/passport-config.json'
	if (fs.existsSync(passportFilePath)) {
		return passportFilePath
	} else {
		let devenvPath = './devenv'
		if(!fs.existsSync(devenvPath)) {
			fs.mkdirSync(devenvPath)
			fs.writeFileSync(
				(devenvPath + '/passport-config.json'), JSON.stringify(passportConfigFileData)
			)
		}

		return `${devenvPath}/passport-config.json`
	}
}

module.exports = {
	passportFile : passportConfigFilePath(),
	saltFile : '/opt/gluu-server/etc/gluu/conf/salt',
	timerInterval: 600000,
}
