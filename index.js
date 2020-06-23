var forever = require('forever-monitor')

// restarts all dynos when error rate goes too high
const errorRestarterFile = 'errorRestarter.js'

var errorRestarterChild = new (forever.Monitor)(errorRestarterFile, {
  args: []
})

errorRestarterChild.on('exit', function () {
  console.log(`${errorRestarterFile} has exited`)
})

errorRestarterChild.start()

// restarts a proportion of dynos every set period of time
const periodicRestarterFile = 'periodicRestarter.js'

var periodicRestarterChild = new (forever.Monitor)(periodicRestarterFile, {
  args: []
})

periodicRestarterChild.on('exit', function () {
  console.log(`${periodicRestarterFile} has exited`)
})

periodicRestarterChild.start()
