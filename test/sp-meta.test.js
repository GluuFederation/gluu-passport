import chai from 'chai'
import passportSAML from 'passport-saml'
import { writeMeta_, generate } from '../server/sp-meta.js'
import config from 'config'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

describe('Test SP Meta Helper', () => {
  describe('writeMeta_ test', () => {
    it('should exist', () => {
      assert.exists(writeMeta_)
    })

    it('should be function', () => {
      assert.isFunction(writeMeta_, 'writeMeta_ is not a function')
    })
  })

  describe('generate meta test', () => {
    const testSAMLProvider = passportConfigAuthorizedResponse.providers.find(p => p.id === 'saml-only-1')
    const metaFile = `../server/idp-metadata/${testSAMLProvider.id}.xmll`

    it('should exist', () => {
      assert.exists(generate)
    })

    it('should be function', () => {
      assert.isFunction(generate, 'generateJWKS is not a function')
    })

    it('should generate metafile for provider in idp-metadata folder', async () => {
      const PassportSAMLStrategy = passportSAML.Strategy
      const oPassportSAMLStrategy = new PassportSAMLStrategy(testSAMLProvider.options, () => { /* */ })

      await generate(testSAMLProvider, oPassportSAMLStrategy)
      assert.exists(metaFile, `${metaFile} file not found`)
    })
  })
})
