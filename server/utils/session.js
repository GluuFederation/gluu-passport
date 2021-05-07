const expressSession = require('express-session')
const MemoryStore = require('memorystore')(expressSession)
const config = require('config')
const { secretKey } = require('./misc')

const expressSessionConfig = {
  cookie: {
    maxAge: config.get('cookieMaxAge'),
    path: config.get('cookiePath'),
    sameSite: config.get('cookieSameSite'),
    secure: config.get('cookieSecure')
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: secretKey(),
  resave: false,
  saveUninitialized: false
}

const session = expressSession(expressSessionConfig)

module.exports = {
  session
}
