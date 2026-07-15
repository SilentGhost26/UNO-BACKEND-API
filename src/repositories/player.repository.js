const Player = require('../models/player.model');

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

module.exports = {
    create,
    getById,
    update,
    remove
}