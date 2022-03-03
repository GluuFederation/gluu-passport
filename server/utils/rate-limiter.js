import rateLimit from 'express-rate-limit'
import config from 'config'

const windowMs = config.get('rateLimitWindowMs')
const max = config.get('rateLimitMaxRequestAllow')

const rateLimiter = rateLimit({
  windowMs,
  max,
  message: `You have exceeded the ${max} requests in ${windowMs} milliseconds limit!`,
  headers: true
})

export {
  rateLimiter,
  windowMs,
  max
}
