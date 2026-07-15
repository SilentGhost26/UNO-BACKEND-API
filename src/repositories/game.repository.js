const Game = require('../models/game.model');

const create = (gameData) => {
    return await Game.create(gameData);
}

const getById = async (id) => {
    return await Game.findByPk(id);
}

const update = async (id, gameData) => {
    const game = await Game.findByPk(id);
    if (!game) {
        return null;
    }

    return await game.update(gameData);
}

const remove = async (id) => {
    const game = await Game.findByPk(id);
    if (!game) {
        return false;
    }

    await game.update({ isDeleted: true });
}

module.exports = {
    create,
    getById,
    update,
    remove
}