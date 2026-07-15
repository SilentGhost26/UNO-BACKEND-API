const playerRepository = require('../repositories/player.repository');
const playerDto = require('../dto/player.dto');
const notFoundHelper = require('../helpers/not-found.helper');

const addPlayer = async (playerData) => {
    const player = playerDto.fromCreateDto(playerData);
    const newPlayer = await playerRepository.create(player);
    return playerDto.toResponseDto(newPlayer);
}

const findPlayerById = async (id) => {
    const player = await playerRepository.getById(id);
    if(!player) {
        notFoundHelper.throwError404(id, 'player');
    }

    return playerDto.toResponseDto(player);
}

const updatePlayer = async (id, playerData) => {
    const player = playerDto.fromUpdateDto(playerData);
    const updatedPlayer = await playerRepository.update(id, player);
    if (!updatedPlayer) {
        notFoundHelper.throwError404(id, 'player');
    }

    return playerDto.toResponseDto(updatedPlayer);
}

const deletePlayer = async (id) => {
    const deleted = await playerRepository.remove(id);
    if(!deleted) {
        notFoundHelper.throwError404(id, 'player');
    }
}

module.exports = {
    addPlayer,
    findPlayerById,
    updatePlayer,
    deletePlayer
}