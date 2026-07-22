const gamePlayerRepository = require('../repositories/game-player.repository');
const gameRepository = require('../repositories/game.repository');
const playerRepository = require('../repositories/player.repository');
const gamePlayerDto = require('../dto/game-player.dto');
const notFoundHelper = require('../helpers/not-found.helper');
const conflictHelper = require('../helpers/conflict.helper')

/**
 * Add a playingPlayer to a specific game, initializing its score
 * @param gamePlayerData : data of the gamePlayer
 * @returns the created gamePlayer
 */
const addGamePlayer = async (gamePlayerData) => {
    const gamePlayer = gamePlayerDto.fromCreate(gamePlayerData);
    const game = await gameRepository.getById(gamePlayer.gameId);
    if (!game) {
        notFoundHelper.throwError404(gamePlayer.gameId, 'game');
    }

    const player = await playerRepository.getById(gamePlayer.playerId);
    if (!player) {
        notFoundHelper.throwError404(gamePlayer.playerId, 'player');
    }

    const playingPlayer = await gamePlayerRepository.getByGameIdPlayerId(gamePlayer.gameId, gamePlayer.playerId);
    if (playingPlayer) {
        conflictHelper.throwError409(`player with ID ${gamePlayer.playerId} already registered ` +
             `in game with ID ${gamePlayer.gameId}`);
    }

    if (game.status != 'WAITING') {
        conflictHelper.throwError409(`Game swith ID ${game.id} is not in waiting state`);
    }
    const totalCurrentPlayers = await gamePlayerRepository.getTotalPlayersInGame(game.id);
    if (game.maxPlayers == totalCurrentPlayers) {
        conflictHelper.throwError409(`The game with ID ${game.id} is full`);
    }

    const newGamePlayer = await gamePlayerRepository.create(gamePlayer);
    return gamePlayerDto.toResponseDto(newGamePlayer);
}

/**
 * Find the scores of all players that are part of a specific game
 * @param gameId : id of game
 * @returns a list of scores
 */
const findScoresBygameId = async (gameId) => {
    const scores = await gamePlayerRepository.getByGameId(gameId);
    if(!scores) {
        notFoundHelper.throwError404(id, 'scores in game');
    }
    return scores.map(s => gamePlayerDto.toScoreResponseDto(s));
}

/**
 * Update the score of a specific gamePlayer
 * @param id : the id of the gamePlayer
 * @param score : the new score
 * @returns the updated score
 */
const updateScore = async (id, score) => {
    const updatedGamePlayer = await gamePlayerRepository.update(id, { score: score });
    if (!updatedGamePlayer) {
        notFoundHelper.throwError404(id, 'gamePlayer');
    }
    return gamePlayerDto.toScoreResponseDto(updatedGamePlayer);
}

/**
 * Remove a specific gamePlayer by its game and player ids
 * @param gameId : id of the game
 * @param playerId : id of the player
 */
const deleteGamePlayer = async (gameId, playerId) => {

    const game = await gameRepository.getById(gameId);
    if (!game) {
        notFoundHelper.throwError404(gameId, 'game');
    }
    if (game.status == 'FINISHED') {
        conflictHelper.throwError409(`game with ID ${gameId} already finished`);
    }

    const gamePlayer = await gamePlayerRepository.getByGameIdPlayerId(gameId, playerId);
    if (!gamePlayer) {
        notFoundHelper.throwError404(playerId, 'player in game');
    }

    await gamePlayerRepository.remove(gamePlayer.id);
}

/**
 * Find the score of a gamePlayer by its id
 * @param id : id of the gamePlayer
 * @returns the found score
 */
const findScoreById = async (id) => {
    const gamePlayer = await gamePlayerRepository.getById(id);
    if(!gamePlayer) {
        notFoundHelper.throwError404(id, 'score');
    }

    return gamePlayerDto.toScoreResponseDto(gamePlayer);
}

const getPlayersByGameId = async (gameId) => {
    console.log(gameId)
    const players = await gamePlayerRepository.getByGameId(gameId);
    if (!players) {
        notFoundHelper.throwError404(gameId, 'players in game');
    }
    return players.map(gamePlayerDto.toGamePlayerInfoDto);
}

module.exports = {
    addGamePlayer,
    findScoresBygameId,
    updateScore,
    deleteGamePlayer,
    findScoreById,
    getPlayersByGameId
}