require('dotenv').config()

const rp = require('request-promise');
const moment = require('moment')
const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_TARGET_APP_API_TOKEN })


const getLogs = async () => {
    const options = {
        uri: 'https://papertrailapp.com/api/v1/events/search.json?q=heroku/router&limit=2000',
        headers: {
            'X-Papertrail-Token': process.env.PAPERTRAIL_TOKEN
        },
        json: true
    };

    const { events } = await rp(options)

    return events

}

const getStatusCode = (log) => {

    try {
        const pair = log.message.split(' status=')
        return Number(pair[1].slice(0, 3))
    } catch (e) {
        return null;
    }
}

const shouldRestart = ({ allowedTimeoutRatio, allowedErrorRatio, minRequests, intervalMs, previousIncludedIntervals }, now, logs) => {

    
    const nowMoment = moment(now)

    const recentLogs = logs.filter(l => {

        const logMoment = moment(l.received_at)
        
        return nowMoment.diff(logMoment) < intervalMs * (previousIncludedIntervals + 1)

    });

    const statusCodes = recentLogs.map(getStatusCode).filter(sc => sc)    

    const errorRatio = statusCodes.filter(sc => sc >= 500).length / statusCodes.length
    const timeoutRatio = statusCodes.filter(sc => sc === 503).length / statusCodes.length

    console.log('datetime', nowMoment.format());
    console.log('request count', statusCodes.length);
    console.log('error ratio', errorRatio);
    console.log('timeout ratio', timeoutRatio);

    if (statusCodes.length < minRequests) { // not enough data to know if we should restart
        return false
    }

    return errorRatio > allowedErrorRatio || timeoutRatio > allowedTimeoutRatio

};

const restartApp = async ({intervalMs, previousIncludedIntervals}) => {
    console.log(`Restarting dynos for ${process.env.APP_NAME}`)
    await heroku.delete(`/apps/${process.env.APP_NAME}/dynos`);
    console.log('Dynos restarted. Pausing restarts')
    await new Promise(r => setTimeout(r, intervalMs * previousIncludedIntervals));
    console.log('Restarts running again');
    
}


const go = async () => {

    try {
        const config = require('./config.json')
        const {intervalMs} = config;

        const logs = await getLogs()

        const now = Date.now();
        if(shouldRestart(config, now, logs)){
            await restartApp(config)
        }else{
            console.log('No restart required')
        }

        await new Promise(r => setTimeout(r, intervalMs));

        process.exit(0)

    } catch (err) {
        console.error('monitor go error: ', err)
    }

}

go()