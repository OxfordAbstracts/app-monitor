const rp = require('request-promise');
const moment = require('moment')
require('dotenv').config()


const getLogs = async () => {
    const options = {
        uri: 'https://papertrailapp.com/api/v1/events/search.json?q=heroku/router&limit=1000',
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

    console.log('nowMoment', nowMoment);
    console.log('statusCodes.length', statusCodes.length);
    console.log('errorRatio', errorRatio);
    console.log('timeoutRatio', timeoutRatio);

    if (statusCodes.length < minRequests) { // not enough data to know if we should restart
        return false
    }

    return errorRatio > allowedErrorRatio || timeoutRatio > allowedTimeoutRatio

};

const restartApp = async () => {

}


const go = async () => {

    try {
        const config = require('./config.json')
        const {intervalMs} = config;

        const logs = await getLogs()

        const now = Date.now();

        if (shouldRestart(config, now, logs)) {
            await restartApp()
        }

        await new Promise(r => setTimeout(r, intervalMs));

        process.exit(0)

    } catch (err) {
        console.error(err)
    }

}

go()