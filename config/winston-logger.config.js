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
        new wintston.transports.File({ filename: process.env.ERROR_LOG_ROUTE, level: 'error', format: errorFormat }),
    ],
});

module.exports = logger;