const logger = require('../utils/logging')

const globalErrorHandler = (err, req, res, next) => {
  logger.log2('error', `Unknown Error: ${err}`)
  logger.log2('error', err.stack)
  res.redirect(
  `${global.basicConfig.failureRedirectUrl}?failure=An error occurred`
  )
}

module.exports = {
  globalErrorHandler
}
