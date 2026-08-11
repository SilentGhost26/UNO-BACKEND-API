const gameRepository = require('../repositories/game.repository');
const gameDto = require('../dto/game.dto');
const notFoundHelper = require('../helpers/not-found.helper');

/**
 * create a new game
 * @param gameData : the data of the game
 * @returns the created game
 */
const addGame = async (gameData) => {
    const game = gameDto.fromCreateDto(gameData);
    const newGame = await gameRepository.create(game);
    return gameDto.toResponseDto(newGame);
}

/**
 * find a specific game by its id
 * @param id : id of the game
 * @returns the found game
 */
const findGameById = async (id) => {
    const game = await gameRepository.getById(id);
    if(!game) {
        notFoundHelper.throwError404(id, 'game');
    }

    return gameDto.toResponseDto(game);
}

/**
 * update a specific game by its id
 * @param id : id of the game
 * @param gameData : data of the game that will be udpated
 * @returns the updated game
 */
const updateGame = async (id, gameData) => {
    const game = gameDto.fromUpdateDto(gameData);
    const updatedGame = await gameRepository.update(id, game);
    if (!updatedGame) {
        notFoundHelper.throwError404(id, 'game');
    }
    return gameDto.toResponseDto(updatedGame);
}

/**
 * Delete a specific game by its id
 * @param id : id of the game
 */
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
    deleteGame,
}