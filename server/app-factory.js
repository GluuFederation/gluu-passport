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
const { session } = require('./utils/session')
// Setup http proxy config
require('./utils/http-global-proxy')

class AppFactory {
  createApp () {
    app.use(metricsMiddleware)
    app.use(morgan('short', { stream: logger.logger.stream }))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())
    app.use(flash())

    // store rateLimiter for later manipulation/reset
    app.rateLimiter = (req, res, next) => next()
    app.use((req, res, next) => {
      return app.rateLimiter(req, res, next)
    })

    app.set('trust proxy', 1)
    app.use(session)
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

    return app
  }
}

module.exports = AppFactory
