const { runValidators } = require('../helpers/result.helper');
/**
 * Factory to create the game player service
 * @param gamePlayerRepository : dependency of game player repository
 * @param gameRepository : dependency of game repository
 * @param playerRepository : dependency of player repository
 * @param gamePlayerDto : dependency of game player dto
 * @param notFoundHelper : dependency of not found helper
 * @param conflictHelper : dependency of conflic helper
 * @returns literal object with the functions of game player service
 */
const createGamePlayerService = (
    gamePlayerRepository,
    gameRepository,
    playerRepository,
    gamePlayerDto,
    notFoundHelper,
    conflictHelper,
    { runValidators, ok },
    addGamePlayervalidators = [],
) => {
    /**
     * Add a playingPlayer to a specific game, initializing its score
     * @param gamePlayerData : data of the gamePlayer
     * @returns the created gamePlayer
    */
   const addGamePlayer = async (gamePlayerData) => {
       const gamePlayer = gamePlayerDto.fromCreate(gamePlayerData);
       const game = await gameRepository.getById(gamePlayer.gameId);
        const player = await playerRepository.getById(gamePlayer.playerId);
        const playingPlayer = await gamePlayerRepository.getByGameIdPlayerId(gamePlayer.gameId, gamePlayer.playerId);
        const currentPlayers = await gamePlayerRepository.getByGameId(gamePlayer.gameId);
        const context = {game, gameId: gamePlayer.gameId, player, playerId: gamePlayer.playerId, playingPlayer, currentPlayers };

        const result = runValidators(addGamePlayervalidators, context);
        if (!result.ok) {
            return result;
        }
        gamePlayer.position = currentPlayers[currentPlayers.length - 1].position + 1;
        
        const newGamePlayer = await gamePlayerRepository.create(gamePlayer);
        return ok(gamePlayerDto.toResponseDto(newGamePlayer));
    }
        
    /**
     * Find the scores of all players that are part of a specific game
     * @param gameId : id of game
     * @returns a list of scores
    */
    const findScoresBygameId = async (gameId) => {
        const scores = await gamePlayerRepository.getByGameId(gameId);
        if(!scores) {
            return notFoundHelper.throwError404(gameId, 'scores in game');
        }
        return ok(scores.map(s => gamePlayerDto.toScoreResponseDto(s)));
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
           return notFoundHelper.throwError404(id, 'gamePlayer');
        }
        return ok(gamePlayerDto.toScoreResponseDto(updatedGamePlayer));
    }
        
    /**
     * Remove a specific gamePlayer by its game and player ids
     * @param gameId : id of the game
     * @param playerId : id of the player
    */
    const deleteGamePlayer = async (gameId, playerId) => {   
       const game = await gameRepository.getById(gameId);
       if (!game) {
           return notFoundHelper.throwError404(gameId, 'game');
        }
        if (game.status == 'FINISHED') {
            return conflictHelper.throwError409(`game with ID ${gameId} already finished`);
        }
        
        const gamePlayer = await gamePlayerRepository.getByGameIdPlayerId(gameId, playerId);
        if (!gamePlayer) {
            return notFoundHelper.throwError404(playerId, 'player in game');
        }
        
        await gamePlayerRepository.remove(gamePlayer.id);
        return ok();
    }
        
    /**
     * Find the score of a gamePlayer by its id
     * @param id : id of the gamePlayer
     * @returns the found score
    */
    const findScoreById = async (id) => {
       const gamePlayer = await gamePlayerRepository.getById(id);
       if(!gamePlayer) {
           return notFoundHelper.throwError404(id, 'score');
        }
        
        return ok(gamePlayerDto.toScoreResponseDto(gamePlayer));
    }
        
    /**
     * Get the list of players that are part of a specific game
     * @param gameId : id of the game
     * @returns the list of players
    */
    const getPlayersByGameId = async (gameId) => {
       const players = await gamePlayerRepository.getByGameId(gameId);
       if (!players) {
           return notFoundHelper.throwError404(gameId, 'players in game');
        }
        return ok(players.map(gamePlayerDto.toGamePlayerInfoDto));
    }
        
    /**
     * get the current player that must do something in a game
     * @param gameId : id of the game
     * @returns the current player  
     */
    const getCurrentPlayerToPlay = async (gameId) => {
        const game = await gameRepository.getById(gameId);
        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }
        
        if (game.status != 'PLAYING') {
            return conflictHelper.throwError409(`game with ID $${gameId} is not in playing state`);
        }
        const player = await gamePlayerRepository.getCurrentPlayerToPlay(gameId);
        return ok(gamePlayerDto.toGamePlayerInfoDto(player));
    }
        
    return { addGamePlayer, findScoresBygameId, updateScore, deleteGamePlayer, findScoreById, getPlayersByGameId, getCurrentPlayerToPlay }
}
module.exports = createGamePlayerService;