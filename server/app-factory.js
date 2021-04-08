const express = require('express')
const app = express()
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const morgan = require('morgan')
const logger = require('./utils/logging')
const routes = require('./routes')
const metricsMiddleware = require('../server/utils/metrics')
const { secretKey } = require('./utils/misc')
const { globalErrorHandler } = require('./utils/error-handler')
const flash = require('connect-flash')
const { rateLimiter } = require('./utils/rate-limiter')

class AppFactory {
  createApp () {
    app.use(metricsMiddleware)
    app.use(morgan('short', { stream: logger.logger.stream }))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())
    app.use(flash())
    app.use(rateLimiter)
    app.set('trust proxy', 1)

    app.use(session({
      cookie: {
        maxAge: 86400000,
        secure: true,
        path: '/passport',
        sameSite: 'none'
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      secret: secretKey(),
      resave: false,
      saveUninitialized: false
    }))
    
    app.use(passport.initialize())
    app.use(passport.session())
    app.use('/passport', routes)
    app.use(globalErrorHandler)

    passport.serializeUser((user, done) => {
      done(null, user)
    })
    passport.deserializeUser((user, done) => {
      done(null, user)
    })
    // store rateLimiter middleware for later manipulation/reset
    app.rateLimiter = rateLimiter
    return app
  }
}

module.exports = AppFactory
