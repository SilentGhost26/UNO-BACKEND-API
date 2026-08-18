const joi = require('joi');

const playerSchema = joi.object({
    name: joi.string().min(3).max(20).required(),
    age: joi.number().integer().min(5).max(100).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required()
});

module.exports = playerSchema;