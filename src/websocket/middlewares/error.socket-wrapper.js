const logger = require('../../../config/winston-logger.config');

const errorWrapper = (socket, handler) => async (data) => {
    try {
        await handler(data);
    } catch (error) {
        logger.error({ 
            timestamp: error.timestamp, 
            stack: error.stack, 
            message: error.message,
            statusCode: error.statusCode,
            source: 'WEBSOCKET',
            details: error.details || [],
        });
        socket.emit('error', {
            message: error.message || 'internal server error',
            statusCode: error.statusCode || 500,
            details: error.details || [],
        });
    }
}

module.exports = errorWrapper;