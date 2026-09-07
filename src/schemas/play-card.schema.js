const joi = require('joi');

const playCard = joi.object({
    cardId: joi.number().integer().positive().required(),
    newColor: joi.string().valid('RED', 'GREEN', 'BLUE', 'YELLOW', null).optional(),
});

module.exports = playCard;