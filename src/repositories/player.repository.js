const Player = require('../models/player.model');
const Game = require('../models/game.model');

const create = async (playerData) => {
    return await Player.create(playerData);
}

const getById = async (id) => {
    const player = await Player.findByPk(id);
    if(!player || player.isDeleted) {
        return null;
    }

    return player;
}

const update = async (id, playerData) => {
    const player = await Player.findByPk(id);
    if (!player || player.isDeleted) {
        return null;
    }

    return await player.update(playerData);
}

const remove = async (id) => {
    const player = await Player.findByPk(id);
    if (!player || player.isDeleted) {
        return false;
    }

    await player.update({ isDeleted: true });
    return true;
}

const getFromSpecificGame = async (playerId, gameId) => {
    const player = await Player.findOne({
        where: {
            id: playerId
        },
        include: [{
            model: Game,
            as: 'matchedGames',
            where: {
                id: gameId
            },
            through: {
                attributes: []
            }
        }]
    })

    if (!player) {
        return null;
    }

    return player;
}

module.exports = {
    create,
    getById,
    update,
    remove,
    getFromSpecificGame
}