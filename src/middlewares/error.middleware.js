const logger = require('../../config/winston-logger.config');

const processError = (err, req, res, next) => {
    logger.error({ 
        timestamp: err.timestamp, 
        stack: err.stack, 
        message: err.message,
        statusCode: err.statusCode,
        source: 'API-CALL',
        details: err.details || [],
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'internal server error';
    const details = err.details || [];

    res.status(statusCode).json({
        message: message,
        details: details
    });
}

module.exports = processError;