const rateLimit = require('express-rate-limit')
const logger = require('./logging')
let checkWindowMs = 0
let checkMax = 0

const configure = (app, windowMs = 86400000, max = 1000) => {
  if (windowMs === checkWindowMs && max === checkMax) {
    logger.log2('debug', 'Skip ratelimit config, already config with same values')
    return
  }
  checkWindowMs = windowMs
  checkMax = max
  logger.log2('info', `configure rate-limiter windowMs=${windowMs} maxRequestAllow=${max}`)
  app.rateLimiter = rateLimit({
    windowMs,
    max,
    message: `You have exceeded the ${max} requests in ${windowMs} milliseconds limit!`,
    headers: true
  })
}

module.exports = {
  configure
}
