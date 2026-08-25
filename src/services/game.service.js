/**
 * Factory to create the game service
 * @param gameRepository : dependency of game repository
 * @param playerRepository : dependency of game player repository
 * @param gamePlayerRepository : dependency of gamePlayerRepository
 * @param gameDto : depedendency of game dto
 * @param notFoundHelper : dependency of not found helper
 * @param conflictHelper : dependency of conflict helper
 */
const createGameService = (
    gameRepository,
    playerRepository,
    gamePlayerRepository,
    gameDto,
    notFoundHelper,
    conflictHelper,
    { runValidators, ok },
    gameStartValidators = [],
    gameFinishValidators = []
) => {

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
           return notFoundHelper.throwError404(game.ownerId, 'player');
        } 
        
        const newGame = await gameRepository.create(game);
        await gamePlayerRepository.create({ gameId: newGame.id, playerId: newGame.ownerId, position: 1 });
        return ok(gameDto.toResponseDto(newGame));
    }
    
    /**
     * find a specific game by its id
     * @param id : id of the game
     * @returns the found game
    */
   const findGameById = async (id) => {
       const game = await gameRepository.getById(id);
       if(!game) {
           return notFoundHelper.throwError404(id, 'game');
        }
        
        return ok(gameDto.toResponseDto(game));
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
           return notFoundHelper.throwError404(id, 'game');
        }
        return ok(gameDto.toResponseDto(updatedGame));
    }
    
    /**
     * Delete a specific game by its id
     * @param id : id of the game
    */
   const deleteGame = async (id) => {
       const deleted = await gameRepository.remove(id);
       if(!deleted) {
           return notFoundHelper.throwError404(id, 'game');
        }
        return ok();
    }
    
    /**
     * Start a specific game
     * @param {*} gameId : id of the game
     * @param {*} playerId : id of the player that wants to start the game
    */
   const startGame = async (gameId, playerId) => {
       const game = await gameRepository.getById(gameId);
        const currentPlayers = await gamePlayerRepository.getByGameId(gameId);
        const player = await playerRepository.getById(playerId);
        const context = { game, gameId, currentPlayers, player, playerId };
        const result = runValidators(gameStartValidators, context);
        if (!result.ok) {
            return result;
        }

        await gameRepository.update(gameId, { status: 'PLAYING' });
        return ok();
    }
    
    /**
     * Finish a game that is playing
     * @param gameId : id of the game
     * @param playerId : id of the player that wants to finish the game
    */
   const finishGame = async (gameId, playerId) => {
        const game = await gameRepository.getById(gameId);
        const player = await playerRepository.getById(playerId);
        const context = { game, gameId, player, playerId };
        const result = runValidators(gameFinishValidators, context);
        if (!result.ok) {
            return result;
        }
        await gameRepository.update(gameId, { status: 'FINISHED' });
        return ok();
    }
    return { addGame, findGameById, updateGame, deleteGame, startGame, finishGame };
}
module.exports = createGameService;