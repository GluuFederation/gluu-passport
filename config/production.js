module.exports = {
  passportFile: '/etc/gluu/conf/passport-config.json',
  saltFile: '/etc/gluu/conf/salt',
  timerInterval: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  rateLimitWindowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  rateLimitMaxRequestAllow: 100000,
  appInsightsKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
  cookieMaxAge: null,
  cookiePath: '/passport',
  cookieSameSite: 'none',
  cookieSecure: true
}
