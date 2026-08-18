const playerRepository = require('../repositories/player.repository');
const playerDto = require('../dto/player.dto');
const notFoundHelper = require('../helpers/not-found.helper');
const conflictHelper = require('../helpers/conflict.helper');

/**
 * create a new player
 * @param playerData : the data of the player
 * @returns the created player
 */
const addPlayer = async (playerData) => {
    const player = playerDto.fromCreateDto(playerData);

    const existingPlayer = await playerRepository.getByEmail(player.email)
    if (existingPlayer) {
        conflictHelper.throwError409('The email is already registered');
    }

    const newPlayer = await playerRepository.create(player);
    return playerDto.toResponseDto(newPlayer);
}

/**
 * find a specific player by its id
 * @param id : id of the player
 * @returns the found player
 */
const findPlayerById = async (id) => {
    const player = await playerRepository.getById(id);
    if(!player) {
        notFoundHelper.throwError404(id, 'player');
    }

    return playerDto.toResponseDto(player);
}

/**
 * update a specific player by its id
 * @param id : id of the player
 * @param gameData : data of the player that will be udpated
 * @returns the updated player
 */
const updatePlayer = async (id, playerData) => {
    const player = playerDto.fromUpdateDto(playerData);
    const updatedPlayer = await playerRepository.update(id, player);
    if (!updatedPlayer) {
        notFoundHelper.throwError404(id, 'player');
    }

    return playerDto.toResponseDto(updatedPlayer);
}

/**
 * Delete a specific player by its id
 * @param id : id of the player
 */
const deletePlayer = async (id) => {
    const deleted = await playerRepository.remove(id);
    if(!deleted) {
        notFoundHelper.throwError404(id, 'player');
    }
}

/**
 * Get the date of log out of a specific player
 * @param id : id of the player
 * @returns the date of log out
 */
const getLoggedOutDateByPlayerId = async (id) => {
    const date = await playerRepository.getLoggedOutDateById(id);

    if (!date) {
        return null;
    }
    return date;
}

module.exports = {
    addPlayer,
    findPlayerById,
    updatePlayer,
    deletePlayer,
    getLoggedOutDateByPlayerId
}