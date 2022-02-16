import config from 'config'
import chai from 'chai'
import esmock from 'esmock'

const assert = chai.assert
const passportConfigAuthorizedResponse = config.get('passportConfigAuthorizedResponse')
const umaConfigURL = passportConfigAuthorizedResponse.conf.serverURI + '/.well-known/uma2-configuration'
const umaConfigTokenEndpoint = passportConfigAuthorizedResponse.conf.serverURI + '/oxauth/restv1/token'
const passportConfig = config.get('passportConfig')
global.basicConfig = passportConfig

const mockUMAGetTokenEndpoint = async () => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          return { body: { token_endpoint: umaConfigTokenEndpoint } }
        }
      }
    }
  })
}

const mockUMAGetTokenEndpointWithErrorResponse = async (errorMessage) => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        get: async () => {
          throw new Error(errorMessage)
        }
      }
    }
  })
}

const mockUMAGetRPT = async (rptToken) => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        post: async () => {
          return { body: { access_token: rptToken } }
        }
      }
    }
  })
}

const mockUMAGetRPTWithError = async (errorMessage) => {
  return await esmock('../server/utils/uma.js', {
    got: {
      default: {
        post: async () => {
          throw new Error(errorMessage)
        }
      }
    }
  })
}

describe('uma.js test', () => {
  describe('test getTokenEndpoint', () => {
    let getTokenEndpoint, uma

    beforeEach(async () => {
      uma = await mockUMAGetTokenEndpoint()
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
      uma = await mockUMAGetTokenEndpointWithErrorResponse(errorMessage)
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
      uma = await mockUMAGetTokenEndpointWithErrorResponse(errorMessage)
      getTokenEndpoint = uma.getTokenEndpoint

      try {
        await getTokenEndpoint(umaConfigURL)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
    })
  })

  describe('test getRPT', () => {
    let getRPT, uma, mockedRPTToken

    beforeEach(async () => {
      mockedRPTToken = 'valid_rpt_token'
      uma = await mockUMAGetRPT(mockedRPTToken)
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

    it('should get RPT token', async () => {
      const ticket = 'ticket'
      const rptToken = await getRPT(ticket, umaConfigTokenEndpoint)
      assert.equal(rptToken.access_token, mockedRPTToken)
    })

    it('should return error when failed request fail', async () => {
      const errorMessage = 'Failed to get RPT Token'

      esmock.purge(uma)
      uma = await mockUMAGetRPTWithError(errorMessage)

      const ticket = 'ticket'
      try {
        await getRPT(ticket, umaConfigTokenEndpoint)
      } catch (e) {
        assert.equal(e.message.trim(), errorMessage)
      }
    })
  })

  // describe('test doRequest', () => {
  //   const doRequest = uma.__get__('doRequest')

  //   it('should exist', () => {
  //     assert.exists(doRequest)
  //   })

  //   it('should be function', () => {
  //     assert.isFunction(doRequest)
  //   })

  //   it('should be request to config endpoint and get ticker', async () => {
  //     const gotGet = stubTicketRequest()

  //     const requestParams = {
  //       uri: passportConfigurationEndpoint,
  //       throwHttpErrors: false
  //     }
  //     const ticketRepsponse = await doRequest(requestParams)
  //     assert(gotGet.calledWith(requestParams.uri, {
  //       throwHttpErrors: false
  //     }))
  //     assert.equal(ticketRepsponse.ticket, mockTicket)
  //     gotGet.restore()
  //   })

  //   it('should return configurations', async () => {
  //     const rpt = {
  //       access_token: 'tEmPtEmPtEmPtEmPtEmPtEmP',
  //       pct: 'PmEtPmEtPmEtPmEtPmEtPmEt'
  //     }
  //     uma.__set__('rpt', rpt)

  //     const gotGet = sinon.stub(got, 'get')
  //     gotGet.reset()
  //     gotGet.resolves(passportConfigAuthorizedGotResponse)
  //     const doRequestParams = {
  //       uri: passportConfigurationEndpoint,
  //       throwHttpErrors: false
  //     }
  //     const configRepsponse = await doRequest(doRequestParams)
  //     assert(gotGet.calledWith(doRequestParams.uri, {
  //       throwHttpErrors: false,
  //       headers: {
  //         authorization: `Bearer ${rpt.access_token}`,
  //         pct: rpt.pct
  //       }
  //     }))
  //     assert.isNotNull(configRepsponse.conf)
  //     assert.isNotNull(configRepsponse.idpInitiated)
  //     assert.isNotNull(configRepsponse.providers)
  //     assert.isNotEmpty(configRepsponse.providers)
  //     gotGet.restore()
  //   })
  // })

  // describe('test processUnauthorized', () => {
  //   const processUnauthorized = uma.__get__('processUnauthorized')

  //   it('should exist', () => {
  //     assert.exists(processUnauthorized)
  //   })

  //   it('should be function', () => {
  //     assert.isFunction(processUnauthorized)
  //   })

  //   it('should return configurations', async () => {
  //     // mock get token endpoint
  //     const gotGet = sinon.stub(got, 'get')
  //     gotGet.reset()
  //     gotGet.onCall(0).resolves(umaConfigGotResponse)

  //     // mock rpt request
  //     const gotGetRPTToken = stubRPTTokenRequest()

  //     // mock get config request
  //     gotGet.onCall(1).resolves(passportConfigAuthorizedGotResponse)

  //     const processUnauthorizedResponse = await processUnauthorized(mockTicket, umaConfigURL, {
  //       uri: passportConfigurationEndpoint,
  //       throwHttpErrors: false
  //     })
  //     assert.isNotNull(processUnauthorizedResponse.conf)
  //     assert.isNotNull(processUnauthorizedResponse.idpInitiated)
  //     assert.isNotNull(processUnauthorizedResponse.providers)
  //     assert.isNotEmpty(processUnauthorizedResponse.providers)

  //     gotGet.restore()
  //     gotGetRPTToken.restore()
  //   })
  // })

  // describe('test request', () => {
  //   const request = uma.__get__('request')

  //   it('should exist', () => {
  //     assert.exists(request)
  //   })

  //   it('should be function', () => {
  //     assert.isFunction(request)
  //   })

  //   it('should return configurations', async () => {
  //     const gotGet = stubTicketRequest()

  //     // mock get token endpoint
  //     gotGet.onCall(1).resolves(umaConfigGotResponse)

  //     // mock rpt request
  //     const gotGetRPTToken = stubRPTTokenRequest()

  //     // mock get config request
  //     gotGet.onCall(2).resolves(passportConfigAuthorizedGotResponse)

  //     const requestResponse = await request({
  //       uri: passportConfigurationEndpoint,
  //       throwHttpErrors: false
  //     })

  //     assert.isNotNull(requestResponse.conf)
  //     assert.isNotNull(requestResponse.idpInitiated)
  //     assert.isNotNull(requestResponse.providers)
  //     assert.isNotEmpty(requestResponse.providers)
  //     gotGetRPTToken.restore()
  //     gotGet.restore()
  //   })
  // })

  // describe('test getClientAssertionJWTToken', () => {
  //   const makeClientAssertionJWTToken = uma.__get__('makeClientAssertionJWTToken')

  //   it('should exists', () => {
  //     assert.exists(makeClientAssertionJWTToken)
  //   })

  //   it('should be function', () => {
  //     assert.isFunction(makeClientAssertionJWTToken)
  //   })

  //   let decodedToken = null
  //   it('should return jwt token', () => {
  //     const token = makeClientAssertionJWTToken('temp_clientId', 'https://temp_tokenEndpoint.com')
  //     assert.isNotNull(token)
  //     decodedToken = jwt.decode(token)
  //     assert.isNotNull(decodedToken)
  //   })

  //   it('decoded token should have integer exp time', () => {
  //     const exp = decodedToken.exp
  //     assert.isNotNull(exp)
  //     assert.isTrue(Number.isInteger(exp))
  //   })
  // })
})
