const joi = require('joi');

const login = joi.object({
    email: joi.string().required(),
    password: joi.string().required()
});

module.exports = login;