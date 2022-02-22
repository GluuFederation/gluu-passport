import chai from 'chai'
import path from 'path'
import fs from 'fs'
import logger from '../server/utils/logging.js'

const assert = chai.assert

const convertOneDigitToTwo = (number) => {
  return ('0' + (number)).slice(-2)
}

describe('logging', () => {
  it('should log currect datetime', async () => {
    logger.log2('debug', 'hello this is a dummy log testing')
    const passportLogFilePath = path.join(__dirname, '../server/utils/logs/passport.log')
    const logText = await fs.readFile(passportLogFilePath, 'binary')
    const newDate = new Date()
    // YYYY-MM-DD HH
    const currentDateTimeTillHour = `${newDate.getFullYear()}-${convertOneDigitToTwo(newDate.getMonth() + 1)}-${convertOneDigitToTwo(newDate.getDate())} ${convertOneDigitToTwo(newDate.getHours())}`
    assert(logText.includes(currentDateTimeTillHour), 'hello this is a dummy log testing')
  })
})
