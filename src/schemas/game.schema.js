const joi = require('joi');

const gameSchema = joi.object({
    title: joi.string().min(3).max(30).required(),
    maxPlayers: joi.number().integer().min(2).required(),
    status: joi.string().valid('waiting', 'playing', 'finished').default('waiting')
});

module.exports = gameSchema;