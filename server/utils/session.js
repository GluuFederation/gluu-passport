import expressSession from 'express-session'
import MemoryStore from 'memorystore'
import config from 'config'
import { randomSecret } from '../utils/misc'
MemoryStore(expressSession)

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

export default expressSession(expressSessionConfig)
