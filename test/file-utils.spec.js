/* eslint-disable security/detect-non-literal-fs-filename */
const chai = require('chai')
const fileUtils = require('../server/utils/file-utils')
const path = require('path')

const assert = chai.assert

describe('fileUtils.writeDataToFile', () => {
  it('should write content in file', async () => {
    const expectedJWKSFolderPath = path.join(__dirname, '../server/jwks')
    const fileName = path.join(fileUtils.makeDir(expectedJWKSFolderPath), 'test-provider-unit-test.json')
    await fileUtils.writeDataToFile(fileName, JSON.stringify({ ktype: 'RS256' }))

    assert.exists(fileName)
    // eslint-disable-next-line security/detect-non-literal-require
    const jwksFile = require(fileName)
    assert.equal(jwksFile.ktype, 'RS256')
  })
})
