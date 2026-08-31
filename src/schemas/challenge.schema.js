const joi = require('joi');

const challenge = joi.object({
    challengedPlayerId: joi.string().required(),
});

module.exports = challenge;