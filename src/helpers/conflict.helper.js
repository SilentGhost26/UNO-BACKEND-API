const { ok, err } = require('./result.helper');

const throwError409 = (message) => {
    const error = new Error(message);
    error.statusCode = 409;
    return err(error);
}

module.exports = { throwError409 };