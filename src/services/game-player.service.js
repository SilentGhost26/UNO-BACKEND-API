const gamePlayerRepository = require('../repositories/game-player.repository');
const gameRepository = require('../repositories/game.repository');
const playerRepository = require('../repositories/player.repository');
const gamePlayerDto = require('../dto/game-player.dto');
const notFoundHelper = require('../helpers/not-found.helper');

const addGamePlayer = async (gameData) => {
    const gamePlayer = gamePlayerDto.fromCreate(gameData);
    const game = await gameRepository.getById(gameData.gameId);
    if (!game) {
        notFoundHelper.throwError404(gameData.gameId, 'game');
    }

    const player = await playerRepository.getById(gameData.playerId);
    if (!player) {
        notFoundHelper.throwError404(gameData.gameId, 'player');
    }

    const currentPlayers = await gamePlayerRepository.getByGameId(gameData.gameId);
    if(currentPlayers.some(p => p.playerId === gameData.playerId)) {
        const error = new Error(`player with ID ${gameData.playerId} already registered ` +
             `in game with ID ${gameData.gameId}`);
        error.statusCode = 409;
        throw error;
    }

    const newGamePlayer = await gamePlayerRepository.create(gamePlayer);
    return gamePlayerDto.toResponseDto(newGamePlayer);
}

const findScoresBygameId = async (gameId) => {
    const scores = await gamePlayerRepository.getByGameId(gameId);
    if(!scores) {
        notFoundHelper.throwError404(id, 'scores in game');
    }
    console.log(scores.map(s => gamePlayerDto.toScoreResponseDto(s)))
    return scores.map(s => gamePlayerDto.toScoreResponseDto(s));
}

const updateScore = async (id, score) => {
    
    const updatedGamePlayer = await gamePlayerRepository.update(id, { score: score });
    if (!updatedGamePlayer) {
        notFoundHelper.throwError404(id, 'gamePlayer');
    }
    return gamePlayerDto.toScoreResponseDto(updatedGamePlayer);
}

const deleteGamePlayer = async (id) => {
    const deleted = await gamePlayerRepository.remove(id);
    if(!deleted) {
        notFoundHelper.throwError404(id, 'gamePlayer');
    }
}

const findScoreById = async (id) => {
    const gamePlayer = await gamePlayerRepository.getById(id);
    if(!gamePlayer) {
        notFoundHelper.throwError404(id, 'score');
    }

    return gamePlayerDto.toScoreResponseDto(gamePlayer);
}

module.exports = {
    addGamePlayer,
    findScoresBygameId,
    updateScore,
    deleteGamePlayer,
    findScoreById
}