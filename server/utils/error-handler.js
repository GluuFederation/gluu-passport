const logger = require('../utils/logging')

const globalErrorHandler = (err, req, res, next) => {
  logger.log2('error', `Error: ${err}`)
  logger.log2('error', err.stack)
  res.redirect(
  `${global.basicConfig.failureRedirectUrl}?failure=An error occurred`
  )
}

class StrategyError extends Error {
  constructor (message = 'Strategy Error') {
    super(message)
    this.name = 'StrategyError'
  }
}

module.exports = {
  globalErrorHandler,
  StrategyError
}
