const fs = require('fs')



/**
 * Gets the default passport configuration file path.
 * If file doesn't exists, creates it and return path
 * @returns {string} passport-config.json file path
 */

// function passportConfigFilePath() {
// 	let passportFilePath = '/opt/gluu-server/etc/gluu/'+
// 		'conf/passport-config.json'
// 	if (fs.existsSync(passportFilePath)) {
// 		return passportFilePath
// 	} else {
// 		let devenvPath = './devenv'
// 		if(!fs.existsSync(devenvPath)) {
// 			fs.mkdirSync(devenvPath)
// 			fs.writeFileSync(
// 				(devenvPath + '/passport-config.json'),
// 				JSON.stringify(passportConfigFileData)
// 			)
// 		}
//
// 		return `${devenvPath}/passport-config.json`
// 	}
// }

module.exports = {
	passportFile : '/opt/gluu-server/etc/gluu/conf/passport-config.json',
	saltFile : '/opt/gluu-server/etc/gluu/conf/salt',
	timerInterval: 60000,
}
