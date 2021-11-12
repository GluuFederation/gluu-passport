module.exports = {
  passportFile: '/etc/gluu/conf/passport-config.json',
  saltFile: '/etc/gluu/conf/salt',
  timerInterval: 60000,
  cookieSameSite: 'none',
  cookieSecure: true,
  HTTP_PROXY: process.env.HTTP_PROXY,
  HTTPS_PROXY: process.env.HTTPS_PROXY,
  NO_PROXY: process.env.NO_PROXY
}
