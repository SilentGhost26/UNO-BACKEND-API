const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const newError = new Error('Validation failed');
            newError.statusCode = 400;
            newError.details = error.details.map((e) => e.message);
            next(newError);
        }
        req.body = value;
        next();
    }
}

module.exports = validate;