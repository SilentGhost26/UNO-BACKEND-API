const joi = require('joi');

const sendInvitation = joi.object({
    playerId: joi.string().required(),
    gameId: joi.string().required(),
});

module.exports = sendInvitation;
