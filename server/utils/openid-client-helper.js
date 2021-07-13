const { JWK: { generateSync }, JWKS: { KeyStore, asKeyStore } } = require('jose')
const { Issuer } = require('openid-client')
const path = require('path')
const fs = require('fs')
const fileUtils = require('../utils/file-utils')
const { logger } = require('./logging')
const clientJWKSFilePath = path.join(`${process.cwd()}/server`, 'jwks')

/**
 * generate jwks and store it in file. file name will be like [provider.id].json
 * @param {*} provider
 * @returns undefined
 */
async function generateJWKS (provider) {
  const keyType = generateSync('RSA')
  const keyStore = new KeyStore(keyType)
  const fileName = path.join(fileUtils.makeDir(clientJWKSFilePath), provider.id + '.json')
  if (!fs.existsSync(fileName)) {
    await fileUtils.writeDataToFile(fileName, JSON.stringify(keyStore.toJWKS(true)))
  }
}

const clients = []

/**
 * Get issuer object
 * @param {*} providerOptions
 * @returns Issuer
 */
async function getIssuer (providerOptions) {
  try {
    return await Issuer.discover(providerOptions.issuer)
  } catch (e) {
    logger.log('debug', e.message)
    logger.log('debug', `Failed to fetch config from ${providerOptions.issuer}/.well-known/openid-configuration OpenID Connect Discovery endpoint, Going for manual setup`)
    return new Issuer(providerOptions)
  }
}

/**
 *  initialize openid-client passport strategy
 * @param {*} provider
 * @returns issuer.client
 */
async function getClient (provider) {
  const { options } = provider
  let client = clients.find(c => c.id === provider.id)
  if (client) {
    return client.client
  }

  const issuer = await getIssuer(options)

  if (options.token_endpoint_auth_method && options.token_endpoint_auth_method === 'private_key_jwt') {
    // generate jwks
    await generateJWKS(provider)
    const jwks = require(path.join(fileUtils.makeDir(clientJWKSFilePath), `${provider.id}.json`))
    const ks = asKeyStore(jwks)
    client = new issuer.Client(options, ks.toJWKS(true))
  } else {
    client = new issuer.Client(options)
  }
  logger.log('debug', `openid-client config: ${JSON.stringify(client)}`)
  clients.push({ id: provider.id, client })
  return client
}

module.exports = {
  getClient,
  generateJWKS
}
