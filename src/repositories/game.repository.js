const Game = require('../models/game.model');

/**
 * Create a game in the database
 * @param gameData : game that will be created
 * @returns the created game
 */
const create = async (gameData) => {
    return await Game.create(gameData);
}

/**
 * Get a specific game from the database
 * @param  id : id of the game 
 * @returns the game that was found
 */
const getById = async (id) => {
    const game = await Game.findByPk(id);
    if(!game || game.isDeleted) {
        return null;
    }

    return game;
}

/**
 * Update a specific game in the database
 * @param id : id of the game
 * @param gameData : values that will be updated
 * @returns The game updated
 */
const update = async (id, gameData) => {
    const game = await Game.findByPk(id);
    if (!game || game.isDeleted) {
        return null;
    }

    return await game.update(gameData);
}

/**
 * Remove a specific game from the database
 * @param id : id of the game
 * @returns a boolean that indicates if the game was deleted
 */
const remove = async (id) => {
    const game = await Game.findByPk(id);
    if (!game || game.isDeleted) {
        return false;
    }

    await game.update({ isDeleted: true });
    return true;
}

module.exports = {
    create,
    getById,
    update,
    remove
}