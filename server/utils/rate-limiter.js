const rateLimit = require('express-rate-limit')
const logger = require('./logging')

const configure = (windowMs = 20000, max = 1000) => {
  logger.log2('info', `configure rate-limiter windowMs=${windowMs} maxRequestAllow=${max}`)
  return rateLimit({
    windowMs,
    max,
    message: `You have exceeded the ${max} requests in ${windowMs} milliseconds limit!`,
    headers: true
  })
}

module.exports = {
  configure
}
