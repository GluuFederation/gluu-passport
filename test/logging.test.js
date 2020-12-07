/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const assert = chai.assert
const rewire = require('rewire')
const rewiredLogging = rewire('../server/utils/logging.js')
const path = require('path')

describe('logging.js file', () => {
  describe('dir', () => {
    const dir = rewiredLogging.__get__('dir')

    it('should exist', () => {
      assert.exists(dir, 'dir is none or undefined')
    })

    it('should be equal NODE_LOGGING_DIR env if it exists', () => {
      process.env.NODE_LOGGING_DIR = 'dirname'
      const rewiredLoggingEnvStub = rewire('../server/utils/logging.js')
      const rewiredDir = rewiredLoggingEnvStub.__get__('dir')
      assert.equal(rewiredDir, 'dirname')
    })
    it('should be equal absolute path for utils/logs', () => {
      const expected = path.join(__dirname, '../server/utils/logs')
      assert.equal(dir, expected)
    })
  })
  describe('defaultLogOptions', () => {
    const defaultLogOptions = rewiredLogging.__get__('defaultLogOptions')
    it('should exist', () => {
      assert.exists(defaultLogOptions)
    })
    it('should have propper keys / values', () => {
      const dir = rewiredLogging.__get__('dir')
      const expected = {
        filename: dir + '/passport-%DATE%.log',
        handleExceptions: true,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m'
      }
      assert.deepEqual(defaultLogOptions, expected)
    })
  })
  describe('flogOpts', () => {
    const defaultLogOptions = rewiredLogging.__get__('defaultLogOptions')
    const flogOpts = rewiredLogging.__get__('flogOpts')

    it('should exist', () => {
      assert.exists(flogOpts)
    })

    it('should have propper keys / values', () => {
      const dir = rewiredLogging.__get__('dir')
      const expected = {
        filename: dir + '/passport.log',
        maxSize: defaultLogOptions.maxSize,
        maxFiles: 5,
        options: { flags: 'w' }
      }
      assert.deepEqual(flogOpts, expected)
    })
  })
})
