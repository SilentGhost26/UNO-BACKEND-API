const processError = (err, req, res, next) => {
    console.error(`ERROR ${err.stack}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'internal server error';
    const details = err.details || [];

    res.status(statusCode).json({
        message: message,
        details: details
    });
}

module.exports = processError;