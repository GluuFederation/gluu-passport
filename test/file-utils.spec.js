import chai from 'chai'
import path from 'path'
import fs from 'fs'
import * as fileUtils from '../server/utils/file-utils.js'

const assert = chai.assert

describe('fileUtils.writeDataToFile', () => {
  it('should write content in file', async () => {
    const expectedJWKSFolderPath = path.join(__dirname, '../server/jwks')
    const fileName = path.join(fileUtils.makeDir(expectedJWKSFolderPath), 'test-provider-unit-test.json')
    await fileUtils.writeDataToFile(fileName, JSON.stringify({ ktype: 'RS256' }))

    assert.exists(fileName)
    const jwksFile = JSON.parse(
      fs.readFileSync(
        new URL(fileName, import.meta.url)
      )
    )
    assert.equal(jwksFile.ktype, 'RS256')
  })
})
