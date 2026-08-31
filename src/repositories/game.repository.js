const { sequelize } = require('../database/mysql.database');
const Game = require('../models/game.model');
const Rules = require('../models/rules.model');

/**
 * Create a game in the database
 * @param gameData : game that will be created
 * @returns the created game
 */
const create = async (gameData) => {
    const data = {...gameData};
    const result = sequelize.transaction(async () => {
        const game = await Game.create(data);
        data.rules.gameId = game.id;
        const rules = await Rules.create(data.rules);
        game.rules = rules;
        return game;
    });
    return result;
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

/**
 * Get a specific game from the database including its rules
 * @param  id : id of the game 
 * @returns the game that was found
 */
const getByIdWithRules = async (id) => {
    const game = await Game.findByPk(id, {
        include: {
            model: Rules,
            as: 'rules'
        }
    });
    if(!game || game.isDeleted) {
        return null;
    }

    return game;
}
module.exports = {
    create,
    getById,
    update,
    remove,
    getByIdWithRules,
}