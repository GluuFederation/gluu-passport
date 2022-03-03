import chai from 'chai'
import sinon from 'sinon'
import * as webUtils from '../server/utils/web-utils.js'

const assert = chai.assert

const mockResIfReqNull = {
  code: 0,
  msg: '',
  status (code) {
    this.code = code
    return this
  },
  send (msg) {
    this.msg = msg
    return this
  }
}

const mockResIfReqNotNull = {
  url: '',
  redirect (url) {
    this.url = url
    return this
  }
}

describe('web utils', () => {
  const handleError = webUtils.handleError

  it('should be exists', async () => {
    assert.exists(handleError)
  })

  it('should be function', () => {
    assert.isFunction(handleError)
  })

  it('should call res.status once when req is null', () => {
    const res = mockResIfReqNull

    const spyStatus = sinon.spy(res, 'status')
    handleError(null, res, 'error')
    assert.isTrue(spyStatus.calledOnce)
  })

  it('should call res.status with 500 http status when req is null', () => {
    const res = mockResIfReqNull
    handleError(null, res, 'error')
    assert.equal(res.code, 500)
  })

  it('should call res.status with correct msg when req is null', () => {
    const res = mockResIfReqNull
    handleError(null, res, 'custom error')
    assert.equal(res.msg, 'custom error')
  })

  it('should call res.redirect once when req is not null', () => {
    const res = mockResIfReqNotNull

    const spyRedirect = sinon.spy(res, 'redirect')
    handleError({ failureUrl: 'https://test/com' }, res, 'error')
    assert.isTrue(spyRedirect.calledOnce)
  })

  it('should call res.redirect with correct url once when req is not null', () => {
    const res = mockResIfReqNotNull

    const failureUrl = 'https://test.com'
    const error = 'custom error'
    const fullUrl = `${failureUrl}?failure=${error}`

    handleError({ failureUrl }, res, error)
    assert.equal(res.url, fullUrl)
  })
})
