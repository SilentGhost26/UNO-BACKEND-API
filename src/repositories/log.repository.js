const Log = require('../models/log.model');

/**
 * Create a new log record
 * @param logData : Data of the log
 * @returns 
 */
const create = async (logData) => {
    return await Log.create(logData);
}

module.exports = {
    create,
};
