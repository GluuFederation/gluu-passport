import chai from 'chai'
import esmock from 'esmock'
import { fileURLToPath } from 'url'
import * as path from 'path'

const assert = chai.assert
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mockLogging = async () => {
  return esmock('../server/utils/logging.js', {})
}

const mockLoggingWinSton = async () => {
  return esmock('../server/utils/logging.js', {
    winston: {
      createLogger: () => ({ log2: null }),
      format: {
        combine: () => true,
        splat: () => true,
        padLevels: () => true,
        timestamp: () => true,
        printf: () => true
      }
    }
  })
}

describe('logging.js file', () => {
  let logging

  describe('dir', () => {
    const logDirPath = path.join(__dirname, '../server/utils/logs')

    beforeEach(async () => {
      logging = await mockLogging()
    })

    afterEach(async () => {
      esmock.purge(mockLogging)
    })

    it('should exist', () => {
      assert.exists(logging.dir, 'dir is none or undefined')
    })

    it('should be equal NODE_LOGGING_DIR env if it exists', () => {
      process.env.NODE_LOGGING_DIR = logDirPath
      assert.equal(logging.dir, logDirPath)
    })

    it('should be equal absolute path for utils/logs', () => {
      assert.equal(logging.dir, logDirPath)
    })
  })

  describe('defaultLogOptions', () => {
    before(async () => {
      logging = await mockLogging()
    })

    after(async () => {
      esmock.purge(mockLogging)
    })

    it('should exist', () => {
      assert.exists(logging.defaultLogOptions)
    })

    it('should have propper keys / values', () => {
      const dir = logging.dir
      const expected = {
        filename: dir + '/passport-%DATE%.log',
        handleExceptions: true,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m'
      }
      assert.deepEqual(logging.defaultLogOptions, expected)
    })
  })

  describe('fileLogOptions', () => {
    let fileLogOptions

    before(async () => {
      logging = await mockLogging()
      fileLogOptions = logging.fileLogOptions
    })

    after(async () => {
      esmock.purge(mockLogging)
    })

    it('should exist', () => {
      assert.exists(fileLogOptions)
    })

    it('should have propper keys / values', () => {
      const dir = logging.dir
      const defaultLogOptions = logging.defaultLogOptions
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
    let logger
    before(async () => {
      logging = await mockLoggingWinSton()
      logger = logging.logger
    })

    after(async () => {
      esmock.purge(mockLogging)
    })

    it('should exist', () => {
      assert.exists(logger)
    })

    it('should be an object', () => {
      assert.isObject(logger, 'logger is not an object')
    })

    it('should call return correct object value', () => {
      assert.equal(logger.log2, null)
    })

    describe('stream', () => {
      it('should exist', () => {
        assert.exists(logger.stream, 'steam is not found')
      })

      it('should have a write property setup', () => {
        assert.exists(logger.stream.write, 'steam.write is not found')
      })

      it('write property should be function', () => {
        assert.isFunction(logger.stream.write, 'steam.write is not a function')
      })
    })
  })
})
