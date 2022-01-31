import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import morgan from 'morgan'
import logger from './utils/logging'
import routes from './routes'
import metricsMiddleware from '../server/utils/metrics'
import { globalErrorHandler } from './utils/error-handler'
import flash from 'connect-flash'
import { rateLimiter } from './utils/rate-limiter'
import { session } from './utils/session'
import './utils/http-global-proxy'
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
