/**
 * Wait for server to start (event appStarted) to start tests
 */
before((done) => {
  const server = require('../server/app')
  server.on('appStarted', function () {
    // remember you need --timeout on mocha CLI to be around 20000
    console.log('app started event listened...')
    done()
  })
})
