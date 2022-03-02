import chai from 'chai'
import config from 'config'
import sinon from 'sinon'
import esmock from 'esmock'
import { v4 as uuidv4 } from 'uuid'
import { Strategy } from 'openid-client'
import nock from 'nock'
import InitMock from './testdata/init-mock.js'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')

const mockOIDCHelperGenerateJWKS = async (makeDirSpy, joseGenerateKeyPairSpy, exportJWKSpy, calculateJwkThumbprintSpy, writeDataToFileSpy) => {
  return esmock('../server/utils/openid-client-helper.js', {
    '../server/utils/file-utils.js': {
      makeDir: () => {
        makeDirSpy()
        return '../server/jwks'
      },
      writeDataToFile: async () => {
        writeDataToFileSpy()
        return undefined
      }
    },
    jose: {
      generateKeyPair: async () => {
        joseGenerateKeyPairSpy()
        return { privateKey: 'xyz', publicKey: 'abc' }
      },
      exportJWK: async () => {
        exportJWKSpy()
        return {}
      },
      calculateJwkThumbprint: async () => {
        calculateJwkThumbprintSpy()
        return 'kid_random'
      }
    }
  })
}

const mockOIDCHelperGetIssuer = async () => {
  return esmock('../server/utils/openid-client-helper.js', {
    'openid-client': {
      Issuer: {
        discover: () => { /* This is intentional blank */ }
      }
    }
  })
}

const mockOIDCHelperGetIssuerWithoutDiscovery = async () => {
  return esmock('../server/utils/openid-client-helper.js', {
    'openid-client': {
      Issuer: {
        default: () => { /* This is intentional blank */ },
        discover: () => {
          throw new Error('Not connecting')
        }
      }
    }
  })
}

describe('Test OpenID Client Helper', () => {
  describe('generateJWKS test', () => {
    let generateJWKS, oidcHelper, makeDirSpy, joseGenerateKeyPairSpy, exportJWKSpy, calculateJwkThumbprintSpy, writeDataToFileSpy

    before(async () => {
      makeDirSpy = sinon.spy()
      joseGenerateKeyPairSpy = sinon.spy()
      exportJWKSpy = sinon.spy()
      calculateJwkThumbprintSpy = sinon.spy()
      writeDataToFileSpy = sinon.spy()
      oidcHelper = await mockOIDCHelperGenerateJWKS(makeDirSpy, joseGenerateKeyPairSpy, exportJWKSpy, calculateJwkThumbprintSpy, writeDataToFileSpy)
      generateJWKS = oidcHelper.generateJWKS
    })

    after(() => {
      esmock.purge(oidcHelper)
      sinon.restore()
    })

    const callGenerateJWKS = async () => {
      try {
        await generateJWKS({ id: uuidv4() })
      } catch (e) {}
    }

    it('should exist', () => {
      assert.exists(generateJWKS)
    })

    it('should be function', () => {
      assert.isFunction(generateJWKS, 'generateJWKS is not a function')
    })

    it('should call fileUtils.makeDir once', async () => {
      await callGenerateJWKS()
      assert.isTrue(makeDirSpy.calledOnce)
    })

    it('should call generateKeyPair once', async () => {
      assert.isTrue(joseGenerateKeyPairSpy.calledOnce)
    })

    it('should call exportJWK twice', async () => {
      assert.isTrue(exportJWKSpy.calledTwice)
    })

    it('should call calculateJwkThumbprint once', async () => {
      assert.isTrue(calculateJwkThumbprintSpy.calledOnce)
    })

    it('should call fileUtils.writeDataToFile once', async () => {
      assert.isTrue(writeDataToFileSpy.calledOnce)
    })
  })

  describe('getIssuer test', () => {
    let oidcHelper, getIssuer

    before(async () => {
      oidcHelper = await mockOIDCHelperGetIssuer()
      getIssuer = oidcHelper.getIssuer
    })

    after(() => {
      esmock.purge(oidcHelper)
    })

    it('should exist', () => {
      assert.exists(getIssuer)
    })

    it('should be function', () => {
      assert.isFunction(getIssuer, 'getIssuer is not a function')
    })

    it('should return the Issuer object when no discovery endpoint available', async () => {
      const issuer = await getIssuer({})
      assert.exists(issuer, 'failed to setup issuer object')
    })

    it('should return the Issuer object when discovery endpoint available', async () => {
      esmock.purge(oidcHelper)
      oidcHelper = await mockOIDCHelperGetIssuerWithoutDiscovery()
      getIssuer = oidcHelper.getIssuer

      const issuer = await getIssuer({})
      assert.exists(issuer, 'failed to setup issuer object')
    })
  })

  describe('getClient test', () => {
    let oidcHelper, getClient
    const testProvider = passportConfigAuthorizedResponse.providers.find(p => p.id === 'oidccedev6privatejwt')

    before(async () => {
      oidcHelper = await mockOIDCHelperGetIssuer()
      getClient = oidcHelper.getClient
    })

    after(() => {
      esmock.purge(oidcHelper)
    })

    it('should exist', () => {
      assert.exists(getClient)
    })

    it('should be function', () => {
      assert.isFunction(getClient, 'getClient is not a function')
    })

    it('should return the client object to initialize openid-client strategy when no discovery endpoint available', async () => {
      const client = await getClient(testProvider)
      assert.exists(client, 'failed to make client for openid-client strategy')
      const strategy = new Strategy({ client }, () => {})
      assert.exists(strategy, 'Failed to create strategy')
    })

    it('should return the client object to initialize openid-client strategy when discovery endpoint available', async () => {
      const initMock = new InitMock()
      initMock.discoveryURL(testProvider.options.issuer)

      const client = await getClient(testProvider)
      assert.exists(client, 'failed to make client for openid-client strategy')
      const strategy = new Strategy({ client }, () => {})
      assert.exists(strategy, 'Failed to create strategy')
      nock.cleanAll()
    })

    it('we have now already client initialize so we should get client from state', async () => {
      const client = await getClient(testProvider)
      assert.exists(client, 'failed to get client for openid-client strategy')
      const strategy = new Strategy({ client }, () => {})
      assert.exists(strategy, 'Failed to create strategy')
    })
  })
})
