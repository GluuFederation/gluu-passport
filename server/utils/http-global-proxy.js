import config from 'config'
import ga from 'global-agent'

if (config.has('HTTP_PROXY')) {
  ga.bootstrap()
  global.GLOBAL_AGENT.HTTP_PROXY = config.get('HTTP_PROXY')
  global.GLOBAL_AGENT.HTTPS_PROXY = config.get('HTTPS_PROXY')
  global.GLOBAL_AGENT.NO_PROXY = config.get('NO_PROXY')
}
