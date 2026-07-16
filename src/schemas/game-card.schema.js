const joi = require('joi');

const gameCard = joi.object({
    zone: joi.string().valid('DECK', 'HAND', 'DISCARD').required(),
    position: joi.number().integer(),
    playerId: joi.string()
});

module.exports = gameCard;