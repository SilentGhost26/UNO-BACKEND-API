const jwt = require('jsonwebtoken');

/**
 * Create a jwt token based on the player information
 * @param player : information of the player
 * @returns : A valid jwt token
 */
const createUserToken = (player) => {
    return jwt.sign(
        {
        id: player.id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h'
        }
    );
}

/**
 * Decodes a tokens to verify the signature
 * @param token : The token to validate
 * @returns the decoded information of the token
 */
const decodeValidToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
}

module.exports = {
    createUserToken,
    decodeValidToken
}