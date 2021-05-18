const logger = require('../utils/logging')

const globalErrorHandler = (err, req, res, next) => {
  logger.log2('error', `Unknown Error: ${err}`)
  logger.log2('error', err.stack)
  let errInfo = err.sicErrURL ? err.sicErrURL : "An error occurred";
  res.redirect(
  `${global.basicConfig.failureRedirectUrl}?failure=${errInfo}`
  )
}

module.exports = {
  globalErrorHandler
}
