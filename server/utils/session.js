import expressSession from 'express-session'
import createMemoryStore from 'memorystore'
import config from 'config'
import { randomSecret } from '../utils/misc.js'
const MemoryStore = createMemoryStore(expressSession)

const expressSessionConfig = {
  cookie: {
    maxAge: 86400000,
    sameSite: config.get('cookieSameSite'),
    secure: config.get('cookieSecure')
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: randomSecret(),
  resave: false,
  saveUninitialized: false
}

const session = expressSession(expressSessionConfig)

export {
  session,
  expressSessionConfig
}
