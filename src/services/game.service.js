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
    gameCardRepository,
    historyRepository,
    gameDto,
    cardDto,
    gamePlayerDto,
    gameCardDto,
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
        return ok(gameDto.toStatusResponseDto(game));
    }

    const findGameByIdWithRules = async (id) => {
       const game = await gameRepository.getByIdWithRules(id);
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

    const getGameStatus = async (id) => {
        const game = await gameRepository.getById(id);
       if(!game) {
           return notFoundHelper.throwError404(id, 'game');
        }
        
        const players = await gamePlayerRepository.getByGameId(id);
        if (game.status === 'WAITING') {
            return ok({
                game: gameDto.toStatusResponseDto(game),
                players: players.map(p => gamePlayerDto.toGamePlayerInfoDto(p)),
            });
        }

        const currentPlayer = await gamePlayerRepository.getCurrentPlayerToPlay(id); 
        currentPlayer.Player = await playerRepository.getById(currentPlayer.playerId);
        const topCard = await gameCardRepository.getTopCardFromDiscard(id);
        const hands = await Promise.all(
            players.map(async p => {
                const hand = (await gameCardRepository.getPlayerHand(id, p.playerId)).map(c => cardDto.toResponseDto(c.Card));
                p.cardsInHand = hand;
                return gameCardDto.toHandResponseDto(p); 
            })
        );
        
        const history = await historyRepository.getByGameId(id);
        const topCardDiscard = topCard? cardDto.toResponseDto(topCard.Card) : null;
        return ok({
            game: gameDto.toStatusResponseDto(game),
            currentPlayer: gamePlayerDto.toGamePlayerInfoDto(currentPlayer),
            topCard: topCardDiscard,
            hands: hands,
            history: history.map(h => { 
                return {
                    action: h.action,
                    player: h.Player.name,
                }
            }),
        });
    }

    return { addGame, findGameById, updateGame, deleteGame, startGame, finishGame, findGameByIdWithRules, getGameStatus };
}
module.exports = createGameService;