const joi = require('joi');

const score = joi.object({
    score: joi.number().integer().min(0).required()
});

module.exports = score;