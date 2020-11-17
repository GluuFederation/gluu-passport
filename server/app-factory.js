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
const csurf = require('csurf')
const { randomSecret } = require('./utils/misc')

class AppFactory {
  createApp () {
    app.use(metricsMiddleware)
    app.use(morgan('short', { stream: logger.logger.stream }))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(cookieParser())
    app.use(csurf({ cookie: true }))

    app.use(session({
      cookie: {
        maxAge: 86400000
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      secret: randomSecret,
      resave: false,
      saveUninitialized: false
    }))

    app.use(passport.initialize())
    app.use(passport.session())
    app.use('/passport', routes)

    // Default error handler
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, { redirect }, next) => {
      logger.log2('error', `Unknown Error: ${err}`)
      logger.log2('error', err.stack)
      redirect(
    `${global.basicConfig.failureRedirectUrl}?failure=An error occurred`
      )
    })
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
