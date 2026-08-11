const throwError409 = (message) => {
    const error = new Error(message);
    error.statusCode = 409;
    throw error;
}

module.exports = { throwError409 };