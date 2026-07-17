const joi = require('joi');

const gamePlayer = joi.object({
    gameId: joi.string().required(),
    playerId: joi.string().required()
});

module.exports = gamePlayer;