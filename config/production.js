let cookieSecure = process.env.PASSPORT_COOKIE_SECURE

if (cookieSecure == undefined) {
  cookieSecure = true
} else {
  cookieSecure = cookieSecure === 'true' ? true : false; 
}

module.exports = {
  passportFile: '/etc/gluu/conf/passport-config.json',
  saltFile: '/etc/gluu/conf/salt',
  timerInterval: parseInt(process.env.PASSPORT_TIMER_INTERVAL) || 60000,
  rateLimitWindowMs: parseInt(process.env.PASSPORT_RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  rateLimitMaxRequestAllow: parseInt(process.env.PASSPORT_RATE_LIMIT_MAX_REQUEST_ALLOW) || 1000,
  cookieSameSite: process.env.PASSPORT_COOKIE_SAME_SITE || 'none',
  cookieSecure,
  HTTP_PROXY: process.env.HTTP_PROXY,
  HTTPS_PROXY: process.env.HTTPS_PROXY,
  NO_PROXY: process.env.NO_PROXY
}
