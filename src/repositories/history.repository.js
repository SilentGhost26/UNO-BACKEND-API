const History = require('./../models/history.model');
const Game = require('./../models/game.model');
const Player = require('./../models/player.model');

/**
 * Function to create a record of history
 * @param historyData : the data of the record 
 * @returns the created record
 */
const create = async (historyData) => {
    return await History.create(historyData);
}

/**
 * get a record of history by its id
 * @param id : id of the record
 * @returns : the record
 */
const getById = async (id) => {
    const history = await History.findByPk(id);
    if (!history) {
        return null;
    }
    return history;
}

/**
 * get the history of a specific game
 * @param gameId : id of the game
 * @returns a list of history
 */
const getByGameId = async (gameId) => {
    return await History.findAll({
        where: {
            gameId: gameId
        },
        include: [
            {
                model: Game,
                where: { isDeleted: false }
            },
            {
                model: Player
            }
        ]
    });
}

module.exports = {
    create,
    getById,
    getByGameId,
}