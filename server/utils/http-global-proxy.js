const configure = (HTTP_PROXY, HTTPS_PROXY, NO_PROXY) => {
  if (HTTP_PROXY) {
    const ga = require('global-agent')
    ga.bootstrap()
    global.GLOBAL_AGENT.HTTP_PROXY = HTTP_PROXY
    global.GLOBAL_AGENT.HTTPS_PROXY = HTTPS_PROXY
    global.GLOBAL_AGENT.NO_PROXY = NO_PROXY
  }
}

module.exports = {
  configure
}
