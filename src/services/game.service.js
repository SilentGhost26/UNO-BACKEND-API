const gameRepository = require('../repositories/game.repository');
const playerRepository = require('../repositories/player.repository');
const gamePlayerRepository = require('../repositories/game-player.repository');
const gameDto = require('../dto/game.dto');
const notFoundHelper = require('../helpers/not-found.helper');
const conflictHelper = require('../helpers/conflict.helper');
const Game = require('../models/game.model');

/**
 * create a new game
 * @param gameData : the data of the game
 * @param playerId : id of the player that create the game
 * @returns the created game
 */
const addGame = async (gameData) => {
    const game = gameDto.fromCreateDto(gameData);

    const player = await playerRepository.getById(game.ownerId);
    if (!player) {
        notFoundHelper.throwError404(game.ownerId, 'player');
    } 
    
    const newGame = await gameRepository.create(game);
    await gamePlayerRepository.create({ gameId: newGame.id, playerId: newGame.ownerId });
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

/**
 * Start a specific game
 * @param {*} gameId : id of the game
 * @param {*} playerId : id of the player that wants to start the game
 */
const startGame = async (gameId, playerId) => {
    const game = await gameRepository.getById(gameId);
    if (!game) {
        notFoundHelper.throwError404(gameId, 'game');
    }
    if (game.status == 'PLAYING') {
        conflictHelper.throwError409(`game with ID ${gameId} already playing`);
    }
    if (game.status == 'FINISHED') {
        conflictHelper.throwError409(`game with ID ${gameId} already finished`);
    }
    const currentPlayers = await gamePlayerRepository.getByGameId(gameId);
    if (currentPlayers.length < 2) {
        conflictHelper.throwError409(`game with ID ${gameId} doesn't have enough players`);
    }

    const player = await playerRepository.getById(playerId);
    if (!player) {
        notFoundHelper.throwError404(gameId, 'player');
    }
    if (game.ownerId != player.id) {
        conflictHelper.throwError409(`player with ID ${playerId} is not the owner`);
    }

    await gameRepository.update(gameId, { status: 'PLAYING' });
}

module.exports = {
    addGame,
    findGameById,
    updateGame,
    deleteGame,
    startGame,
}