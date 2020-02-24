var rp = require('request-promise');
require('dotenv').config()


const getLogs = async () => {
    const options = {
        uri: 'https://papertrailapp.com/api/v1/events/search.json?limit=2000',
        headers: {
            'X-Papertrail-Token': process.env.PAPERTRAIL_TOKEN
        },
        json: true
    };

    const {events} = await rp(options)

    return events

}

const getStatusCode = (log) => {

    try {
        const parts = log.message.split(' status=')
        return Number(parts[1].slice(0, 3))
    }catch(e){
        return null;
    }
}

const shouldRestart = ({ allowedTimeoutRatio, allowedErrorRatio }, logs) => {

    const routerLogs = logs.filter(l => l.program === 'heroku/router')

    const statusCodes = routerLogs.map(getStatusCode).filter(sc => sc)


    if(statusCodes.length < 100){ // not enough data to know if we should restart
        return false
    }

    const errorRatio = statusCodes.filter(sc => sc >= 500).length / statusCodes.length
    const timeoutRatio = statusCodes.filter(sc => sc === 503).length / statusCodes.length
    
    return errorRatio > allowedErrorRatio || timeoutRatio > allowedTimeoutRatio
    
};

const restartApp = async () => {

}


const go = async () => {

    try{
        const config = require('./config.json')

        const logs = await getLogs()
    
        if (shouldRestart(config, logs)) {
            await restartApp()
        }

        await new Promise(r => setTimeout(r, config.sleepMsBetweenCycles));

    }catch(err){
        console.error(err)
    }
    
}

go()