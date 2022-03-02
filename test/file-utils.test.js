import chai from 'chai'
import esmock from 'esmock'
import { fileURLToPath } from 'url'
import * as path from 'path'
import sinon from 'sinon'

const assert = chai.assert
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mockFileUtils = async (fsOpenSpy = sinon.spy(), fsWriteSpy = sinon.spy()) => {
  return esmock('../server/utils/file-utils.js', {
    fs: {
      open (file, mode, callback) {
        fsOpenSpy(file, mode)
        return callback(null, true)
      },
      write (file, data, callback) {
        fsWriteSpy(file, data)
        return callback(null, true)
      },
      existsSync: () => true,
      closeSync: () => undefined
    }
  })
}

describe('fileUtils.makeDir', () => {
  let fileUtils
  before(async () => {
    fileUtils = await mockFileUtils()
  })

  after(() => {
    esmock.purge(fileUtils)
  })

  it('should be exists', async () => {
    assert.exists(fileUtils.makeDir)
  })

  it('should be function', () => {
    assert.isFunction(fileUtils.makeDir)
  })

  it('jwksDir should be return correct path', () => {
    const expectedJWKSFolderPath = path.join(__dirname, '../server/jwks')
    assert.equal(fileUtils.makeDir(expectedJWKSFolderPath), expectedJWKSFolderPath)
  })
})

describe('fileUtils.writeDataToFile', () => {
  let fileUtils

  const fsOpenSpy = sinon.spy()
  const fsWriteSpy = sinon.spy()

  before(async () => {
    fileUtils = await mockFileUtils(fsOpenSpy, fsWriteSpy)
  })

  it('should be exists', () => {
    assert.exists(fileUtils.writeDataToFile)
  })

  it('should be function', () => {
    assert.isFunction(fileUtils.writeDataToFile)
  })

  it('should called correctly with valid arguments', async () => {
    const expectedJWKSFolderPath = path.join(__dirname, '../server/jwks')
    const fileName = path.join(fileUtils.makeDir(expectedJWKSFolderPath), 'test-provider-unit-test.json')
    await fileUtils.writeDataToFile(fileName, JSON.stringify({ ktype: 'RS256' }))

    assert.isTrue(fsOpenSpy.calledOnceWith(fileName, 'w'))
  })
})
