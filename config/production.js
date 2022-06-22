module.exports = {
  passportFile: '/etc/gluu/conf/passport-config.json',
  saltFile: '/etc/gluu/conf/salt',
  timerInterval: 60000,
  rateLimitWindowMs: parseInt(process.env.PASSPORT_RATE_LIMIT_WINDOW_MS, 10) || 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  rateLimitMaxRequestAllow: parseInt(process.env.PASSPORT_RATE_LIMIT_MAX_REQUEST_ALLOW, 10) || 1000,
  cookieSameSite: 'none',
  cookieSecure: true,
  HTTP_PROXY: process.env.HTTP_PROXY,
  HTTPS_PROXY: process.env.HTTPS_PROXY,
  NO_PROXY: process.env.NO_PROXY
}
