const joi = require('joi');

const invitationResponse = joi.object({
    invitationId: joi.string().guid().required(),
});

module.exports = invitationResponse;
