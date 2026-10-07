const { message } = require("../schemas/player.schema");

const createLoggerService = (
    logger,
) => {
    const log = (level) => (event, data) => {
        logger.log({ level, event, category: event.split('_')[0], ...data });
    }

    return { info: log('info'), error: log('error'), warn: log('warn') };
}

module.exports = createLoggerService;