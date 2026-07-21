const bcrypt = require('bcrypt');
const tokenService = require('./token.service');
const playerService = require('./player.service');
const playerRepository = require('../repositories/player.repository');
const saltRounds = 10;

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
        return tokenService.createUserToken(player.id);
    } else {
        const error = new Error('incorrect email or password');
        error.statusCode = 401;
        throw error;
    }
}

module.exports = {
    registerPlayer,
    authenticatePlayer
}