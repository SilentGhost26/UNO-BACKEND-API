const GamePlayer = require('../models/game-player.model');
const Game = require('../models/game.model');
const Player = require('../models/player.model');

/**
 * Get the gamePlayers in a specific game
 * @param  gameId : id of the game
 * @returns a list of gamePlayers
 */
const getByGameId = async (gameId) => {
    const players = await GamePlayer.findAll({
        where: {
            gameId: gameId,
            isDeleted: false
        },
        include: {
            model: Game,
            where: { isDeleted: false }
        }
    });

    if (!players) {
        return null;
    }

    return players;
}

/**
 * Create a gamePlayer in the database
 * @param gamePlayerData : gamePlayer that will be created
 * @returns the created gamePlayer
 */
const create = async (gamePlayerData) => {
    if (!gamePlayerData) {
        throw new Error('gamePlayerData cannot be null');
    }
    return await GamePlayer.create(gamePlayerData);
}

/**
 * Update a specific gamePlayer in the database
 * @param id : id of the gamePlayer
 * @param gamePlayerData : values that will be updated
 * @returns The updated gamePlayer
 */
const update = async (id, gamePlayerData) => {
    if (!gamePlayerData) {
        throw new Error('gamePlayerData cannot be null');
    }
    const gamePlayer = await GamePlayer.findOne({
        where: {
            id: id,
            isDeleted: false
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false }
        },
        {
            model: Player,
            where: { isDeleted: false }
        }
        ]
    });
    if (!gamePlayer) {
        return null;
    }

    return await gamePlayer.update(gamePlayerData);
}

/**
 * Get a specific gamePlayer from the database
 * @param  id : id of the gamePlayer 
 * @returns the gamePlayer that was found
 */
const getById = async (id) => {
    const gamePlayer = await GamePlayer.findOne({
        where: {
            id: id,
            isDeleted: false
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false }
        },
        {
            model: Player,
            where: { isDeleted: false }
        }
        ]
    });
    if(!gamePlayer) {
        return null;
    }

    return gamePlayer;
}

/**
 * Remove a specific gamePlayer from the database
 * @param id : id of the gamePlayer
 * @returns a boolean that indicates if the gamePlayer was deleted
 */
const remove = async (id) => {
    const gamePlayer = await GamePlayer.findOne({
        where: {
            id: id,
            isDeleted: false
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false }
        },
        {
            model: Player,
            where: { isDeleted: false }
        }
        ]
    });

    if (!gamePlayer) {
        return false;
    }

    await gamePlayer.update({ isDeleted: true });
    return true;
}

/**
 * Get the amount of players that are already related with a game
 * @param gameId : id of the game
 * @returns the amount of players
 */
const getTotalPlayersInGame = async (gameId) => {
    return await GamePlayer.count({
        where: {
            gameId: gameId,
            isDeleted: false
        }
    });
}

module.exports = {
    remove,
    create,
    getByGameId,
    getById,
    update,
    getTotalPlayersInGame
}