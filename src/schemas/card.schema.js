const joi = require('joi');

const card = joi.object({
    color: joi.string().valid('GREEN', 'BLUE', 'YELLOW', 'RED', 'MULTICOLOR').required(),
    value: joi.string().max(4),
    type: joi.string().max(15).required()
});

module.exports = card;