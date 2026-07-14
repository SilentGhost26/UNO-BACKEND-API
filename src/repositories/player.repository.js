const Player = require('../models/player.model');

const create = async (playerData) => {
    return await Player.create(playerData);
}

const getById = async (id) => {
    return await Player.findByPk(id);
}

const update = async (id, playerData) => {
    const player = await Player.findByPk(id);
    if (!player) {
        return null;
    }

    return await player.update(playerData);
}

const remove = async (id) => {
    const player = await Player.findByPk(id);
    if (!player) {
        return false;
    }

    await player.update({ isDeleted: true });
}

module.exports = {
    create,
    getById,
    update,
    remove
}