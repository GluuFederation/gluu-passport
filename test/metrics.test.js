import chai from 'chai'
import * as metrics from '../server/utils/metrics.js'

const assert = chai.assert

describe('metrics.js', () => {
  const promBundle = metrics.promBundle
  it('promBundle exists', () => {
    assert.exists(
      promBundle,
      'promBundle is null or undefined'
    )
  })

  it('promBundle should be a function', () => {
    assert.isFunction(
      promBundle,
      'promBundle is not a function!')
  })

  const metricsMiddleware = metrics.metricsMiddleware
  it('metricsMiddleware should  not null / undefined', () => {
    assert.exists(
      metricsMiddleware,
      'metricsMiddleware is null or undefined'
    )
  })

  it('metricsMiddleware should be a function', () => {
    assert.isFunction(
      metricsMiddleware,
      'metricsMiddleware is not a function!')
  })

  it('metricsMiddleware should have metrics not null/undef', () => {
    assert.exists(
      metricsMiddleware.metrics,
      'metrics is not defined in metricsMiddleware'
    )
  })

  it('http request duration seconds exists in metrics', () => {
    assert.exists(
      metricsMiddleware.metrics.http_request_duration_seconds,
      'http request duration seconds DOES NOT exists in metrics!'
    )
  })
})
