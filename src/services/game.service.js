const gameRepository = require('../repositories/game.repository');
const gameDto = require('../dto/game.dto');
const notFoundHelper = require('../helpers/not-found.helper');

const addGame = async (gameData) => {
    const game = gameDto.fromCreateDto(gameData);
    const newGame = await gameRepository.create(game);
    return gameDto.toResponseDto(newGame);
}

const findGameById = async (id) => {
    const game = await gameRepository.getById(id);
    if(!game) {
        notFoundHelper.throwError404(id, 'game');
    }

    return gameDto.toResponseDto(game);
}

const updateGame = async (id, gameData) => {
    const game = gameDto.fromUpdateDto(gameData);
    const updatedGame = await gameRepository.update(id, game);
    if (!updatedGame) {
        notFoundHelper.throwError404(id, 'game');
    }
    return gameDto.toResponseDto(updatedGame);
}

const deleteGame = async (id) => {
    const deleted = await gameRepository.remove(id);
    if(!deleted) {
        notFoundHelper.throwError404(id, 'game');
    }
}

module.exports = {
    addGame,
    findGameById,
    updateGame,
    deleteGame
}