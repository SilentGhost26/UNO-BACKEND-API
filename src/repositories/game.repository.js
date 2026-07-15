const Game = require('../models/game.model');

const create = async (gameData) => {
    return await Game.create(gameData);
}

const getById = async (id) => {
    const game = await Game.findByPk(id);
    if(!game || game.isDeleted) {
        return null;
    }

    return game;
}

const update = async (id, gameData) => {
    const game = await Game.findByPk(id);
    if (!game || game.isDeleted) {
        return null;
    }

    return await game.update(gameData);
}

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