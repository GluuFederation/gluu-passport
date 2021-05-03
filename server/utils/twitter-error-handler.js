const logger = require('./logging')
const passportTwitterStrategy = require('passport-twitter').Strategy

// override passport-twitter error handler due to security issue, https://github.com/jaredhanson/passport-twitter/issues/107
const twitterErrorHandler = () => {
  passportTwitterStrategy.prototype.parseErrorResponse = function (body, status) {
    logger.log2('error', 'catched error in custom twitter error handler')
    try {
      const json = JSON.parse(body)
      if (Array.isArray(json.errors) && json.errors.length > 0) {
        return new Error(json.errors[0].message)
      }
    } catch (ex) {
      return new Error(body)
    }
  }
}

module.exports = twitterErrorHandler
