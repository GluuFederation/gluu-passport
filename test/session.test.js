import { expressSessionConfig, session } from '../server/utils/session.js'
import chai from 'chai'
const assert = chai.assert

describe('rate-limiter.js test', () => {
  it('expressSessionConfig should exist', () => {
    assert.exists(expressSessionConfig)
  })

  it('expressSessionConfig should be object', () => {
    assert.isObject(expressSessionConfig)
  })

  it('expressSessionConfig should have cookie.sameSite and cookie.secure', () => {
    const cookie = expressSessionConfig.cookie
    assert.exists(cookie.sameSite)
    assert.exists(cookie.secure)
  })

  it('session should exist', () => {
    assert.exists(session)
  })

  it('session should be function', () => {
    assert.isFunction(session)
  })
})
