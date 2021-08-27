const config = require('config')

if (config.has('HTTP_PROXY')) {
  const ga = require('global-agent')
  ga.bootstrap()
  global.GLOBAL_AGENT.HTTP_PROXY = config.get('HTTP_PROXY')
}
