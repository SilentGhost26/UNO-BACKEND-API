const Player = require('../models/player.model');
const Game = require('../models/game.model');

/**
 * Create a player in the database
 * @param playerData : player that will be created
 * @returns the created card
 */
const create = async (playerData) => {
    return await Player.create(playerData);
}

/**
 * Get a specific player from the database
 * @param  id : id of the player 
 * @returns the player that was found
 */
const getById = async (id) => {
    const player = await Player.findByPk(id);
    if(!player || player.isDeleted) {
        return null;
    }

    return player;
}

/**
 * Update a specific player in the database
 * @param id : id of the player
 * @param playerData : values that will be updated
 * @returns The player updated
 */
const update = async (id, playerData) => {
    const player = await Player.findByPk(id);
    if (!player || player.isDeleted) {
        return null;
    }

    return await player.update(playerData);
}

/**
 * Remove a specific card from the database
 * @param id : id of the card
 * @returns a boolean that indicates if the card was deleted
 */
const remove = async (id) => {
    const player = await Player.findByPk(id);
    if (!player || player.isDeleted) {
        return false;
    }

    await player.update({ isDeleted: true });
    return true;
}



module.exports = {
    create,
    getById,
    update,
    remove
}