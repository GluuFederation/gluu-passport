/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const assert = chai.assert
const rewire = require('rewire')
const rewiredLogging = rewire('../server/utils/logging.js')
const path = require('path')
const sinon = require('sinon')

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
  describe('fileLogOptions', () => {
    const defaultLogOptions = rewiredLogging.__get__('defaultLogOptions')
    const fileLogOptions = rewiredLogging.__get__('fileLogOptions')

    it('should exist', () => {
      assert.exists(fileLogOptions)
    })

    it('should have propper keys / values', () => {
      const dir = rewiredLogging.__get__('dir')
      const expected = {
        filename: dir + '/passport.log',
        maxSize: defaultLogOptions.maxSize,
        maxFiles: 5,
        options: { flags: 'w' }
      }
      assert.deepEqual(fileLogOptions, expected)
    })
  })
  describe('logger', () => {
    const rewiredLogger = rewiredLogging.__get__('logger')
    it('should exist', () => {
      assert.exists(rewiredLogger)
    })
    it('should be an object', () => {
      assert.isObject(rewiredLogger, 'logger is not an object')
    })
    it('should call winston.createLogger once', () => {
      const rewiredWinston = rewiredLogging.__get__('winston')
      const createLoggerSpy = sinon.spy(rewiredWinston, 'createLogger')
      rewire('../server/utils/logging')
      sinon.assert.calledOnce(createLoggerSpy)
      sinon.restore()
    })
    describe('stream', () => {
      it('should exist', () => {
        assert.exists(rewiredLogger.stream, 'steam is not found')
      })
      it('should have a write property setup', () => {
        assert.exists(rewiredLogger.stream.write, 'steam.write is not found')
      })
      it('write property should be function', () => {
        assert.isFunction(rewiredLogger.stream.write, 'steam.write is not a function')
      })
    })
    // this is NOT a unit test:
    //
    // it('should log currect datetime', async () => {
    //   const passportLogFilePath = path.join(__dirname, '../server/utils/logs/passport.log')
    //   console.log(passportLogFilePath)
    //   const logData = await fs.readFile(passportLogFilePath, 'binary')
    //   const newDate = new Date()
    //   // YYYY-MM-DD HH
    //   const currentDateTimeTillHour = `${newDate.getFullYear()}-${('0' + (newDate.getMonth() + 1)).slice(-2)}-${newDate.getDate()} ${newDate.getHours()}`
    //   // assert(logData.includes(currentDateTimeTillHour))
    //   assert.include(logData, currentDateTimeTillHour)
    // })
  })
})
