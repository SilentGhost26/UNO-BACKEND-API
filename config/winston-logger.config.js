const wintston = require('winston');

const errorFormat = wintston.format.combine(
    wintston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    wintston.format.printf(({ source, timestamp, statusCode, stack, details }) => {
        return `ERROR: ${timestamp} - statusCode: ${statusCode || 500} - source: ${source || 'SYSTEM'} - message: ${stack} \n details: ${details}`
    }),
);

const logger = wintston.createLogger({
    transports: [
        new wintston.transports.Console({ format: errorFormat }),
    ],
});

module.exports = logger;