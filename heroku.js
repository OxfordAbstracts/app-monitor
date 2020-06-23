require('dotenv').config()

const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_TARGET_APP_API_TOKEN })

const getDynos = () => heroku.get(`/apps/${process.env.APP_NAME}/dynos`)
const restartDyno = ({ id }) => heroku.delete(`/apps/${process.env.APP_NAME}/dynos/${id}`)

const restartAllDynos = async (delay) => {
  console.log(`Restarting dynos for ${process.env.APP_NAME}`)
  const dynos = getDynos()
  await asyncForEach(dynos, async (dyno) => {
    await restartDyno(dyno)
    await sleep(delay)
  })
  console.log('Dynos restarted')
}

async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  getDynos,
  restartDyno,
  restartAllDynos,
  sleep,
  asyncForEach
}
