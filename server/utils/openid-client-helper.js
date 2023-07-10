const { JWK: { generateSync, asKey }, JWKS: { KeyStore } } = require('jose_v2')
const { Issuer } = require('openid-client')
const path = require('path')
const fs = require('fs')
const fileUtils = require('../utils/file-utils')
const { logger } = require('./logging')
const clientJWKSFilePath = path.join(`${process.cwd()}/server`, 'jwks')
const secretKey = require('./misc').secretKey()
let ks = new KeyStore()
const keysPath = '/run/keyvault/keys/'

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

/**
 * get keystore after creating and adding private keys
 * @returns keystore
 */
async function getKeystore () {
  logger.log('verbose', 'Importing private keys into the keystore')

  fs.readdirSync(keysPath).forEach(file => {
    const akeyPath = path.resolve(keysPath, file)
    if (fs.lstatSync(akeyPath).isFile()) {
      const fileNameRegExp = /(.*?)_(.*?)_(.*?)\.pem/
      const matches = file.match(fileNameRegExp)

      if (matches.length == 4) { // file naming: keydId_use_alg.pem
        try {
          const keyObj = {
            key: fs.readFileSync(akeyPath, 'utf8'),
            passphrase: secretKey
          }

          const opts = {
            kid: `${matches[1]}_${matches[2]}_${matches[3]}`,
            use: matches[2],
            alg: matches[3].toUpperCase()
          }

          // Create the key and add it to the keystore
          const key = asKey(keyObj, opts)
          ks.add(key)
        } catch (err) {
          const msg = 'Private key was not successfully added to the keystore.'
          logger.log('error', `${msg} key: ${file}, error: ${err}`)
        }
      }
    }
  })

  return ks
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
  if (options.token_endpoint_auth_method && options.token_endpoint_auth_method === 'private_key_jwt' && options.use_request_object && options.use_request_object.toString() === 'true') {
    // getKeystore with private keys
    if (ks.size === 0) ks = await getKeystore()
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
