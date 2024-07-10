const winston = require('winston')

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.File({ filename: './logs/logs/app.log', level: 'info' })
    ]
});

module.exports = {
    logger: logger
}