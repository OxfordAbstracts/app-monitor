var rp = require('request-promise');
require('dotenv').config()

const getLogs = async () => {
    const options = {
        uri: 'https://api.github.com/user/repos',
        qs: {
            access_token: 'xxxxx xxxxx' // -> uri + '?access_token=xxxxx%20xxxxx'
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true 
    };
     
    rp(options)
}

const getFailedRequests = (logs) => ({
    errors: [],
    timeouts: []
})

const shouldRestart = ({allowedTimeoutRatio, allowErrorRatio}, logs, {errors, timeouts}) => {

    
};

const restartApp = async () => {

}


const go = async () => {
    const config = require('./config.json')

    const logs = await getLogs()

    const failed = getFailedRequests(logs)

    if(shouldRestart(config, logs, failed)){
        await restartApp()
    }

}

go()