const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const morgan = require('morgan')
const logger = require('./utils/logging')
const routes = require('./routes')
const metricsMiddleware = require('../server/utils/metrics')
const { globalErrorHandler } = require('./utils/error-handler')
const flash = require('connect-flash')
const { rateLimiter } = require('./utils/rate-limiter')
const { session } = require('./utils/session')
const twitterErrorHandler = require('./utils/twitter-error-handler')

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
    app.use(session)

    app.use(passport.initialize())
    app.use(passport.session())
    app.use('/passport', routes)
    app.use(globalErrorHandler)
    twitterErrorHandler()

    passport.serializeUser((user, done) => {
      done(null, user)
    })
    passport.deserializeUser((user, done) => {
      done(null, user)
    })
    // store rateLimiter for later manipulation/reset
    app.rateLimiter = rateLimiter
    return app
  }
}

module.exports = AppFactory
