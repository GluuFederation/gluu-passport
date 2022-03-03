import R from 'ramda'
import { fileURLToPath } from 'url'
import * as path from 'path'
import * as misc from './utils/misc.js'
import * as logger from './utils/logging.js'
import * as fileUtils from './utils/file-utils.js'

const writeMeta_ = R.curry(fileUtils.writeDataToFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function generate (provider, samlStrategy) {
  const opts = provider.options
  const idpMetaPath = path.join(__dirname, 'idp-metadata')
  const fileName = path.join(fileUtils.makeDir(idpMetaPath), provider.id + '.xml')
  const chain = misc.pipePromise(
    dcert => samlStrategy.generateServiceProviderMetadata(dcert, opts.signingCert),
    writeMeta_(fileName)
  )

  logger.log2('info', `Generating XML metadata for ${provider.displayName}`)
  chain(opts.decryptionCert).catch(err => logger.log2('error', `An error occurred: ${err}`))
}

export {
  generate,
  writeMeta_
}
