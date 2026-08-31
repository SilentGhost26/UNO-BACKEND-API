const joi = require('joi');

const playCard = joi.object({
    cardId: joi.string().required(),
    newColor: joi.string().valid('RED', 'GREEN', 'BLUE', 'YELLOW', null).optional(),
});

module.exports = playCard;