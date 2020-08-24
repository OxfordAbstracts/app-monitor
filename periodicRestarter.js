const { getDynos, sleep, restartDyno } = require('./heroku')
const _ = require('lodash')
const INTERVAL = 60 * 60 * 1000 // 60 mins
const RATIO = 0.15

const every15MinsRestart10pcOfDynos = async () => {
  let dynos = await getDynos()

  dynos = _.sortBy(dynos, d => new Date(d.created_at))

  if (!dynos.length) {
    console.log('No dynos')
    await sleep(10000)
    every15MinsRestart10pcOfDynos()
  }

  const timeToSleep = INTERVAL / (RATIO * dynos.length)
  console.log('timeToSleep', timeToSleep)

  await sleep(timeToSleep)

  const dyno = dynos[0]

  console.log('restarting dyno', dyno)
  await restartDyno(dyno)

  every15MinsRestart10pcOfDynos()
}

try {
  every15MinsRestart10pcOfDynos()
} catch (err) {
  console.log('err', err)
}
