const logger = require('../utils/logging')

const globalErrorHandler = (err, req, res, next) => {
  logger.log2('error', `Error: ${err}`)
  logger.log2('error', err.stack)
  let errInfo = err.sicErrURL ? err.sicErrURL : "An error occurred";
  res.redirect(
  `${global.basicConfig.failureRedirectUrl}?failure=${errInfo}`
  )
}

const handleStrategyError = (req, res) => {
  const flashMessages = req.flash('error')
  if (flashMessages && flashMessages.length) {
    throw new StrategyError(JSON.stringify(flashMessages))
  } else {
    throw new StrategyError('Unknown Strategy Error')
  }
}

class StrategyError extends Error {
  constructor (message = 'Strategy Error') {
    super(message)
    this.name = 'StrategyError'
  }
}

module.exports = {
  globalErrorHandler,
  handleStrategyError,
  StrategyError
}
