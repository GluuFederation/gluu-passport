const expressSession = require('express-session')
const MemoryStore = require('memorystore')(expressSession)
const { randomSecret } = require('../utils/misc')
const logger = require('./logging')

let checkCookieSameSite = ''
let checkCookieSecure

const configure = (app, cookieSameSite = 'none', cookieSecure = true) => {
  if (cookieSameSite === checkCookieSameSite && cookieSecure === checkCookieSecure) {
    logger.log2('debug', 'Skip session config, already config with same values')
    return
  }

  checkCookieSameSite = cookieSameSite
  checkCookieSecure = cookieSecure
  logger.log2('info', `configure express session sameSite=${cookieSameSite} secure=${cookieSecure}`)
  const expressSessionConfig = {
    cookie: {
      maxAge: 86400000,
      sameSite: cookieSameSite,
      secure: cookieSecure
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: randomSecret(),
    resave: false,
    saveUninitialized: false
  }
  app.session = expressSession(expressSessionConfig)
}

module.exports = {
  configure
}
