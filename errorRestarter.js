const rp = require('request-promise')
const moment = require('moment')
const { restartAllDynos, sleep } = require('./heroku')

const config = {
  allowedTimeoutRatio: 0.05,
  minErrorCount: 3,
  intervalMs: 10000,
  sampleMs: 60000
}

const getLogs = async () => {
  const options = {
    uri: 'https://papertrailapp.com/api/v1/events/search.json?q=heroku/router&limit=2000',
    headers: {
      'X-Papertrail-Token': process.env.PAPERTRAIL_TOKEN
    },
    json: true
  }

  const { events } = await rp(options)

  return events
}

const getStatusCode = (log) => {
  try {
    const pair = log.message.split(' status=')
    return Number(pair[1].slice(0, 3))
  } catch (e) {
    return null
  }
}

const shouldRestart = ({ allowedTimeoutRatio, sampleMs, minErrorCount }, now, logs) => {
  const nowMoment = moment(now)

  const recentLogs = logs.filter(l => {
    const logMoment = moment(l.received_at)

    return nowMoment.diff(logMoment) < sampleMs
  })

  const statusCodes = recentLogs.map(getStatusCode).filter(sc => sc)

  const errors = statusCodes.filter(sc => sc >= 500).length
  const timeouts = statusCodes.filter(sc => sc >= 503).length

  const errorRatio = errors / statusCodes.length
  const timeoutRatio = timeouts / statusCodes.length

  console.log('datetime', nowMoment.format())
  console.log('request count', statusCodes.length)
  console.log('errors', errors)
  console.log('error ratio', errorRatio)
  console.log('timeouts', timeouts)
  console.log('timeout ratio', timeoutRatio)

  return timeouts >= minErrorCount &&
        timeoutRatio > allowedTimeoutRatio
}

const go = async () => {
  try {
    const { intervalMs } = config

    const logs = await getLogs()

    const now = Date.now()
    if (shouldRestart(config, now, logs)) {
      await restartAllDynos(intervalMs)
      await sleep(60000 * 2)
    } else {
      console.log('No restart required')
    }
    await sleep(intervalMs)
  } catch (err) {
    console.error('errorRestarter error: ', err)
  }

  go()
}

go()
