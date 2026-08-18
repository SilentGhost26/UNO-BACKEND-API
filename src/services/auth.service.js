const bcrypt = require('bcrypt');
const tokenService = require('./token.service');
const playerService = require('./player.service');
const playerRepository = require('../repositories/player.repository');
const notFoundHelper = require('../helpers/not-found.helper');
const saltRounds = 10;

/**
 * Register a new player
 * @param playerData : data of the player that will be registered 
 * @returns the registered player
 */
const registerPlayer = async (playerData) => {
    const playerPassword = playerData.password;
    let hash;
    try {
        hash = await bcrypt.hash(playerPassword, saltRounds);
    } catch (err) {
        throw new Error('Error encripting the password');
    }

    playerData.password = hash;
    return await playerService.addPlayer(playerData);

}

/**
 * Verify if the email and password of a player matches with the database
 * @param email : The email of the player
 * @param password : The password of the player
 * @returns A valid jwt token
 */
const authenticatePlayer = async (email, password) => {
    const player = await playerRepository.getByEmail(email);
    if (!player) {
        const error = new Error('player not registered');
        error.statusCode = 401;
        throw error;
    }
    
    let result;
    try {
        result = await bcrypt.compare(password, player.password);
    } catch (err) {
        throw new Error('Error comparing the password');
    }

    if (result) {
        return tokenService.createUserToken(player);
    } else {
        const error = new Error('incorrect email or password');
        error.statusCode = 401;
        throw error;
    }
}

/**
 * Close the session of a player updating its logged out date
 * @param playerId : id of the player
 */
const logoutPlayer = async (playerId) => {
    const player = await playerRepository.getById(playerId);
    if (!player) {
        notFoundHelper.throwError404(playerId, 'player');
    }

    await playerRepository.update(playerId, { loggedOutAt: Date.now() });
}

module.exports = {
    registerPlayer,
    authenticatePlayer,
    logoutPlayer
}