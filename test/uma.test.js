import config from 'config'
import chai from 'chai'
import esmock from 'esmock'
import jwt from 'jsonwebtoken'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
const umaConfigTokenEndpoint = passportConfigAuthorizedResponse.conf.serverURI + '/oxauth/restv1/token'
const passportConfig = config.get('passportConfig')

global.basicConfig = passportConfig

const ticketResponse = (mockTicket = 'valid_ticket') => ({
  body: '',
  statusCode: 401,
  headers: {
    server: 'Apache/2.4.29 (Ubuntu)',
    'x-xss-protection': '1; mode=block',
    'x-content-type-options': 'nosniff',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'www-authenticate': `UMA realm="Authentication Required", host_id=chris.gluuthree.org, as_uri=https://chris.gluuthree.org/.well-known/uma2-configuration, ticket=${mockTicket}`,
    'content-length': '0',
    connection: 'close'
  }
})

const mockUMA = async (tokenEndpoint = umaConfigTokenEndpoint, rptToken = 'valid_token') => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          return { body: { token_endpoint: tokenEndpoint } }
        },
        post: async () => {
          return { body: { access_token: rptToken } }
        }
      }
    }
  })
}

const mockUMAWithErrorResponse = async (errorMessage) => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          throw new Error(errorMessage)
        },
        post: async () => {
          throw new Error(errorMessage)
        }
      }
    }
  })
}

const mockUMADoRequestWithTicket = async (rptToken = 'valid_token') => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          return ticketResponse('valid_ticket')
        },
        post: async () => {
          return { body: { access_token: rptToken } }
        }
      }
    }
  })
}

const configResponse = {
  statusCode: 200,
  body: JSON.stringify(passportConfigAuthorizedResponse)
}

const mockUMADoRequestWithConfigResponse = async () => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          return configResponse
        }
      }
    }
  })
}

const mockUMAProcessUnauthorized = async (tokenEndpoint = umaConfigTokenEndpoint, rptToken = 'valid_rpt') => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async (uri) => {
          if (uri.includes('uma2-configuration')) {
            return { body: { token_endpoint: tokenEndpoint } }
          } else {
            return configResponse
          }
        },
        post: async () => {
          return { body: { access_token: rptToken } }
        }
      }
    }
  })
}

const mockUMARequest = async (tokenEndpoint = umaConfigTokenEndpoint, rptToken = 'valid_rpt') => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async (uri, options) => {
          if (options.headers) {
            return configResponse
          } else if (uri.includes('uma2-configuration')) {
            return { body: { token_endpoint: tokenEndpoint } }
          } else {
            return ticketResponse('valid_ticket', 401)
          }
        },
        post: async () => {
          return { body: { access_token: rptToken } }
        }
      }
    }
  })
}

describe('uma.js test', () => {
  describe('test getTokenEndpoint', () => {
    let getTokenEndpoint, uma

    beforeEach(async () => {
      uma = await mockUMA()
      getTokenEndpoint = uma.getTokenEndpoint
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should be exist', () => {
      assert.exists(getTokenEndpoint)
    })

    it('should be function', () => {
      assert.isFunction(getTokenEndpoint)
    })

    it('should be request to uma config endpoint and get token endpoint', async () => {
      const tokenEndpoint = await getTokenEndpoint(umaConfigURL)
      assert.equal(tokenEndpoint, umaConfigTokenEndpoint)
    })

    it('should be return error when request fail', async () => {
      esmock.purge(uma)
      const errorMessage = 'Failed to get token endpoint'
      uma = await mockUMAWithErrorResponse(errorMessage)
      getTokenEndpoint = uma.getTokenEndpoint

      try {
        await getTokenEndpoint(umaConfigURL)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
    })

    it('should be return error when token_endpoint is missing in response', async () => {
      esmock.purge(uma)
      const errorMessage = 'getTokenEndpoint. No token endpoint was found'
      uma = await mockUMAWithErrorResponse(errorMessage)
      getTokenEndpoint = uma.getTokenEndpoint

      try {
        await getTokenEndpoint(umaConfigURL)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
    })
  })

  describe('test getRPT', () => {
    let getRPT, uma

    beforeEach(async () => {
      uma = await mockUMA()
      getRPT = uma.getRPT
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should be exist', () => {
      assert.exists(getRPT)
    })

    it('should be function', () => {
      assert.isFunction(getRPT)
    })

    it('should get valid RPT token', async () => {
      const ticket = 'ticket'
      const rptToken = await getRPT(ticket, umaConfigTokenEndpoint)
      assert.equal(rptToken.access_token, 'valid_token')
    })

    it('should return error when failed request fail', async () => {
      const errorMessage = 'Failed to get RPT Token'

      esmock.purge(uma)
      uma = await mockUMAWithErrorResponse(errorMessage)

      const ticket = 'ticket'
      try {
        await getRPT(ticket, umaConfigTokenEndpoint)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
    })
  })

  describe('test doRequest', () => {
    let doRequest, uma, mockTicket

    beforeEach(async () => {
      mockTicket = 'valid_ticket'
      uma = await mockUMADoRequestWithTicket(mockTicket)
      doRequest = uma.doRequest
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should exist', () => {
      assert.exists(doRequest)
    })

    it('should be function', () => {
      assert.isFunction(doRequest)
    })

    it('should be request to config endpoint and get ticket', async () => {
      const ticketRepsponse = await doRequest({ uri: 'http://test', test: 'test' })
      assert.equal(ticketRepsponse.ticket, mockTicket)
    })

    it('should return configurations', async () => {
      esmock.purge(uma)
      uma = await mockUMADoRequestWithConfigResponse()
      doRequest = uma.doRequest

      const configRepsponse = await doRequest({ uri: 'http://test', test: 'test' })
      assert.isNotNull(configRepsponse.conf)
      assert.isNotNull(configRepsponse.idpInitiated)
      assert.isNotNull(configRepsponse.providers)
      assert.isNotEmpty(configRepsponse.providers)
    })
  })

  describe('test processUnauthorized', () => {
    let uma, processUnauthorized

    beforeEach(async () => {
      uma = await mockUMAProcessUnauthorized()
      processUnauthorized = uma.processUnauthorized
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should exist', () => {
      assert.exists(processUnauthorized)
    })

    it('should be function', () => {
      assert.isFunction(processUnauthorized)
    })

    it('should return configurations', async () => {
      const processUnauthorizedResponse = await processUnauthorized('valid_ticket', umaConfigURL, {
        uri: 'http://test.com',
        throwHttpErrors: false
      })

      assert.isNotNull(processUnauthorizedResponse.conf)
      assert.isNotNull(processUnauthorizedResponse.idpInitiated)
      assert.isNotNull(processUnauthorizedResponse.providers)
      assert.isNotEmpty(processUnauthorizedResponse.providers)
    })
  })

  describe('test request', () => {
    let uma, request

    beforeEach(async () => {
      uma = await mockUMARequest()
      request = uma.request
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should exist', () => {
      assert.exists(request)
    })

    it('should be function', () => {
      assert.isFunction(request)
    })

    it('should return configurations', async () => {
      const requestResponse = await request({
        uri: 'http://test.com',
        throwHttpErrors: false
      })

      assert.isNotNull(requestResponse.conf)
      assert.isNotNull(requestResponse.idpInitiated)
      assert.isNotNull(requestResponse.providers)
      assert.isNotEmpty(requestResponse.providers)
    })
  })

  describe('test getClientAssertionJWTToken', () => {
    let makeClientAssertionJWTToken, uma

    beforeEach(async () => {
      uma = await mockUMA()
      makeClientAssertionJWTToken = uma.makeClientAssertionJWTToken
    })

    afterEach(() => {
      esmock.purge(uma)
    })

    it('should exists', () => {
      assert.exists(makeClientAssertionJWTToken)
    })

    it('should be function', () => {
      assert.isFunction(makeClientAssertionJWTToken)
    })

    let decodedToken = null
    it('should return jwt token', () => {
      const token = makeClientAssertionJWTToken('temp_clientId', 'https://temp_tokenEndpoint.com')
      assert.isNotNull(token)
      decodedToken = jwt.decode(token)
      assert.isNotNull(decodedToken)
    })

    it('decoded token should have integer exp time', () => {
      const exp = decodedToken.exp
      assert.isNotNull(exp)
      assert.isTrue(Number.isInteger(exp))
    })
  })
})
