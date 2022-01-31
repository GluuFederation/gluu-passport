import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import morgan from 'morgan'
import flash from 'connect-flash'
import * as logger from './utils/logging.js'
import routes from './routes.js'
import metricsMiddleware from '../server/utils/metrics.js'
import { globalErrorHandler } from './utils/error-handler.js'
import rateLimiter from './utils/rate-limiter.js'
import session from './utils/session.js'
import './utils/http-global-proxy.js'
const app = express()
// Setup http proxy config

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

export { AppFactory, app, flash }
