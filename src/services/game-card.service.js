/**
 * Factory to create the game card service
 * @param gameCardRepository : dependency of game card repository
 * @param gameRepository : dependency of game repository
 * @param cardRepository : dependency of card repository
 * @param playerRepository : dependency of player repository
 * @param gamePlayerRepository : dependency of game player repository
 * @param gameCardDto : dependency of game card dto
 * @param cardDto : dependency of card dto
 * @param notFoundHelper : dependency of not found helper
 * @param conflictHelper : dependency of conflict helper
 * @returns a literal object with the functions of game card service
 */
const creategameCardService = (
    gameCardRepository,
    gameRepository,
    cardRepository,
    playerRepository,
    gamePlayerRepository,
    gameCardDto,
    cardDto,
    notFoundHelper,
    conflictHelper,
    { ok, err, runValidators },
    rulesCreateDeckValidators = [],
) => {

    /**
     * Initialize the deck that will be used by a specific game
     * @param gameId : id of the game
    */
   const createDeck = async (gameId) => {
       const game = await gameRepository.getByIdWithRules(gameId);
       if (!game) {
           return notFoundHelper.throwError404(gameId, 'game');
        }
        const createdDeck = await gameCardRepository.getByGameId(gameId);
        if (createdDeck.length !== 0) {
            return conflictHelper.throwError409(`Game with ID ${gameId} already has a deck`);
        }
        
        const cards = await cardRepository.findAll();
        if (!cards || cards.length === 0) {
            const error = new Error('Cards are not already initialized');
            error.statusCode = 503;
            return err(error);
        }
        const deck = [];
        cards.forEach(c => {
            const validated = runValidators(rulesCreateDeckValidators, { card: c, rules: game.rules });
            if (validated.ok) {
                deck.push({ zone: 'DECK', gameId: gameId, cardId: c.id})
            }
        });
        
        const positions = getRandomNumbers(1, deck.length);
        
        for (let i = 0; i < deck.length; i++) {
            deck[i].position = positions[i];
        }
        
        await gameCardRepository.bulkCreate(deck);
        return ok();
    }
    
    /**
     * get the gameCards that are in a specific game
     * @param gameId : id of the game
     * @returns A list of found gameCards
    */
   const getByGameId = async (gameId) => {
       const game = await gameRepository.getById(gameId);
       if (!game) {
           return notFoundHelper.throwError404(gameId, 'game');
        }
        
        const gameCards = await gameCardRepository.getByGameId(gameId);
        const result = gameCards.toSorted((a, b) => a.position - b.position)
        .map(g => gameCardDto.toGameCardResponseDto(g));
        return ok(result);
    }
    
    const updateGameCard = async (gameId, cardId, gameCardData) => {
        const game = await gameRepository.getById(gameId);
        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }
        
        const card = await cardRepository.getById(cardId) 
        if (!card) {
            return notFoundHelper.throwError404(cardId, 'card');
        }
        
        let playerId = gameCardData.playerId || null;
        
        if(playerId) {
            if (gameCardData.zone != 'HAND') {
                playerId = null;
            } else {
                const player = await gamePlayerRepository.getByGameIdPlayerId(gameId, playerId);
                if (!player) {
                    return notFoundHelper.throwError404(playerId, 'player in game');
                }
            }
        }
        
        if (game.status != 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${gameId} is not playing`);
        }
        
        const newData = {...gameCardData, playerId: playerId};
        if (gameCardData.zone != 'DECK') {
            newData.position = null;
        }
        
        const updatedGameCard = await gameCardRepository.update(gameId, cardId, newData);
        return ok(gameCardDto.toGameCardResponseDto(updatedGameCard));
    }
    
    /**
     * Function to get a list of random number without repetition between a range
     * @param min : minimum value of the numbers 
     * @param max : maximum value of the numbers
     * @returns a list of the generated numbers
    */
   function getRandomNumbers(min, max) {
       const results = [];
       while (results.length < max) {
           const value = Math.floor(Math.random() * (max - min + 1)) + min;
           if (!results.includes(value)) {
               results.push(value);
            }
        }
        return results;
    }
    
    /**
     * Get the top card in the deck of a specific game
     * @param gameId : id of the card
     * @returns The top card
    */
   const getTopCardFromDiscard = async (gameId) => {
       const game = await gameRepository.getById(gameId);
       if (!game) {
           return notFoundHelper.throwError404(gameId, 'game');
        }
        
        const gameCard = await gameCardRepository.getTopCardFromDiscard(gameId);
        if (!gameCard) {
            return ok(null);
        }
        return ok(cardDto.toResponseDto(gameCard.Card));
    }

    /**
     * function to get the cards that a player has in his hand
     * @param gameId : id of the game where the player is playing
     * @param playerId : id of the player
     * @returns a list of cards
     */
    const getPlayerHand = async (gameId, playerId) => {
        const game = await gameRepository.getById(gameId);
        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }

        if (game.status !== 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${gameId} is not playing`);
        }

        const gamePlayer = await gamePlayerRepository.getByGameIdPlayerId(gameId, playerId);
        if (!gamePlayer) {
            return notFoundHelper.throwError404(playerId, 'player');
        }

        const hand = await gameCardRepository.getPlayerHand(gameId, playerId);

        return ok(hand.map(c => cardDto.toResponseDto(c.Card)));
    }
    
    return { createDeck, getByGameId, updateGameCard, getTopCardFromDiscard, getPlayerHand };   
}

module.exports = creategameCardService;