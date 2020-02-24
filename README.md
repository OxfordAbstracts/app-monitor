# app-monitor
Checks error rates and restarts app dynos if too high.

## What
This app will continually check the OA application and restart its dynos if the error rate is too high.

## How
It will check the logs via Papertrail, parse the status codes, and use the heroku API to restart the app if necessary.
