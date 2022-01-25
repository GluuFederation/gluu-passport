import rateLimit from 'express-rate-limit'
import config from 'config'

const windowMs = config.get('rateLimitWindowMs')
const max = config.get('rateLimitMaxRequestAllow')

export default rateLimit({
  windowMs,
  max,
  message: `You have exceeded the ${max} requests in ${windowMs} milliseconds limit!`,
  headers: true
})
