const fs = require('fs')
const path = require('path')
const R = require('ramda')
const Promise = require('bluebird')
const misc = require('./utils/misc')
const openF = misc.curry2AndFlip(Promise.promisify(fs.open))
const writeF = misc.curry2AndFlip(Promise.promisify(fs.write))
const logger = require('./utils/logging')

function writeMeta (fn, metadata) {
  let fd
  const chain = misc.pipePromise(
    openF('w'),
    fdesc => {
      // Save file descriptor in a temp variable (will be needed afterwards)
      fd = fdesc
      return fd
    },
    writeF(metadata),
    written => {
      logger.log2('verbose', `${written} bytes were written`)
      return fs.closeSync(fd) // returns undefined
    }
  )

  logger.log2('info', `Creating file ${fn}`)
  return chain(fn)
}

const
  writeMeta_ = R.curry(writeMeta)
const metadataDir = R.once(() => {
  const idpMetaPath = path.join(__dirname, 'idp-metadata')
  if (!fs.existsSync(idpMetaPath)) {
    fs.mkdirSync(idpMetaPath)
  }
  return idpMetaPath
})

function generate (provider, samlStrategy) {
  const opts = provider.options
  const fileName = path.join(metadataDir(), provider.id + '.xml')
  const chain = misc.pipePromise(
    dcert => samlStrategy.generateServiceProviderMetadata(dcert, opts.signingCert),
    writeMeta_(fileName)
  )

  logger.log2('info', `Generating XML metadata for ${provider.displayName}`)
  chain(opts.decryptionCert).catch(err => logger.log2('error', `An error occurred: ${err}`))
}

module.exports = {
  generate: generate
}
