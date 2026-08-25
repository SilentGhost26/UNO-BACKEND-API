const joi = require('joi');

const playerUpdateSchema = joi.object({
    name: joi.string().min(3).max(20).required(),
    age: joi.number().integer().min(5).max(100).required(),
});

module.exports = playerUpdateSchema;