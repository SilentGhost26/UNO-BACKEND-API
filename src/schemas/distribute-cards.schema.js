const joi = require('joi');

const distributeCards = joi.object({
    cardsPerPlayer: joi.number().integer().min(3).max(10).required(),
});

module.exports = distributeCards;