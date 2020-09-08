// here is the file for run cucumber-js local tests located on /test/feature
// for now is the same as dev (default.js)

// const bdd = require('./default')

const root = process.cwd()
const passportFile = `${root}/test/testdata/passport-config.json`

module.exports = {
	passportFile
}
