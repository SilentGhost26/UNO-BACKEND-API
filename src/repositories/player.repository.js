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

/**
 * Get a player by its email
 * @param email : email of the player
 * @returns the found player
 */
const getByEmail = async (email) => {
    const player = await Player.findOne({
        where: {
            email: email
        }
    });

    if (!player) {
        return null;
    }
    return player;
}

const getLoggedOutDateById = async (id) => {
    const player = await Player.findByPk(id);

    if (!player) {
        return null;
    }
    return player.loggedOutAt;
}

/**
 * Get a list of players using pagination
 * @param page : The page number that will be gotten
 * @param limit : The limit of records in the list
 * @returns a list of players ordered by status and name
 */
const getByPagination = async (page, limit) => {
    const offset = (page - 1) * limit;

    return Player.findAll({
        where: {
            isDeleted: false,
        },
        order: [['status', 'ASC'],
                ['name', 'ASC']],
        limit: limit,
        offset: offset,
    });
}

module.exports = {
    create,
    getById,
    update,
    remove,
    getByEmail,
    getLoggedOutDateById,
    getByPagination,
}