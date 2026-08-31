const joi = require('joi');

const gameSchema = joi.object({
    title: joi.string().min(3).max(30).required(),
    maxPlayers: joi.number().integer().min(2).required(),
    rules: {
        allowDrawFour: joi.boolean().required(),
        allowAccumulateDraw: joi.boolean().required(),
        allowReverse: joi.boolean().required(),
    }
});

module.exports = gameSchema;