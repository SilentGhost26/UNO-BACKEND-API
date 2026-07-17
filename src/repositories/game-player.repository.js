const GamePlayer = require('../models/game-player.model');
const Game = require('../models/game.model');
const Player = require('../models/player.model');

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

const create = async (gamePlayerData) => {
    if (!gamePlayerData) {
        throw new Error('gamePlayerData cannot be null');
    }
    return await GamePlayer.create(gamePlayerData);
}

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

module.exports = {
    remove,
    create,
    getByGameId,
    getById,
    update
}