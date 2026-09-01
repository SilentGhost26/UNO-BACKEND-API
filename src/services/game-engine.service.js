const createGameEngineService = (
    gameRepository,
    gameCardRepository,
    gamePlayerRepository,
    cardDto,
    gameCardDto,
    gamePlayerDto,
    notFoundHelper,
    conflicHelper,
    { ok, err },
) => {

    const distributeCards = async (gameId, cardsPerPlayer) => {
        const game = await gameRepository.getById(gameId);
        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }
        
        if (game.status !== 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${game.id} is not playing`);
        }
        
        if (game.distributedCards) {
            return conflictHelper.throwError409(`game with ID ${game.id} has already distributed the cards`);
        }
        
        const players = await gamePlayerRepository.getByGameId(gameId);
        const cardsInGame = await gameCardRepository.getByGameId(gameId);
        const sortedCards = cardsInGame.toSorted((a, b) => a.position - b.position);

        /**
         * Recursive function to distribute the cards between the players
         */
        function distribute(players, cards, cardsPerPlayer, updatedCards) {
            if (cardsPerPlayer == 0) {
                return updatedCards;
            }
            players.forEach(p => {
                const card = cards.pop();
                card.playerId = p.playerId;
                card.zone = 'HAND';
                card.position = null;
                updatedCards.push(card);
            });
            
            return distribute(players, cards, cardsPerPlayer - 1, updatedCards);
        }

        const distributedCards = distribute(players, sortedCards, cardsPerPlayer, []);
        let updatedCards = await Promise.all(distributedCards.map(c => gameCardRepository.update(c.gameId, c.cardId, c.dataValues)));
        
        
        const card = await gameCardRepository.getTopCardFromDeck(gameId);
        await gameCardRepository.update(gameId, card.cardId, { position: 1, zone: 'DISCARD' });
        await gameRepository.update(gameId, { distributedCards: true, currentColor: card.Card.color });

        const v = ok(players.map(p => {
            const cards = updatedCards.filter(c => c.playerId == p.playerId).map(c => cardDto.toResponseDto(c.Card));
            p.cardsInHand = cards;
            return gameCardDto.toHandResponseDto(p); 
        }));
        
        return v;
    }
    
    /**
     * function to play a card of a player in a specific game following the rules. 
     * @param playerId : id of the player
     * @param gameId : id of the game
     * @param cardId : id of the card
     * @returns The next player that must play
     */
    const playCard = async (playerId, gameId, cardId, newColor) => {
        const currentPlayer = await gamePlayerRepository.getCurrentPlayerToPlay(gameId);
        
        if (!currentPlayer) {
            return notFoundHelper.throwError404(playerId, 'player');
        }
        if (currentPlayer.playerId !== playerId) {
            return conflictHelper.throwError409(`it is not the turn for the player with ID ${playerId}`);
        }
        const game = await gameRepository.getByIdWithRules(gameId);

        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }

        if (game.status !== 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${gameId} is not playing`);
        }
        const card = await gameCardRepository.getByIds(gameId, cardId);
        const lastCard = await gameCardRepository.getTopCardFromDiscard(gameId);
        
        const context = { 
            playerId, 
            gameId, 
            cardId, 
            game, 
            card, 
            rules: game.rules, 
            lastCard, 
            currentPlayer 
        };
        const playResult = runValidators(rulesPlayCardValidators, context);
        if (!playResult.ok) {
            return playResult;
        }

        let mustDraw = false;
        let cardsToDraw = game.accumulatedCardsToDraw;
        if (card.Card.type === '+2') {
            cardsToDraw += 2;
            mustDraw = true;
        } else if (card.Card.type === '+4') {
            cardsToDraw += 4;
            mustDraw = true;
        }

        const nextPlayer = await endTurn({ gameId, card, newColor, mustDraw, cardsToDraw });
        await gameCardRepository.update(gameId, cardId, { zone: 'DISCARD', position: lastCard.position + 1, playerId: null });

        const cuantityCardsInHand = await gameCardRepository.getCuantityCardsInHand(gameId, playerId);

        if (cuantityCardsInHand === 0) {
            await gameRepository.update(gameId, { status: 'FINISHED', winnerId: playerId });
            const playersInGame = await calculateScores(gameId);
            return ok({
                action: 'Player won the game',
                played: cardDto.toResponseDto(card.Card),
                winner: gamePlayerDto.toGamePlayerInfoDto(currentPlayer),
                scores: playersInGame.map(gamePlayerDto.toScoreResponseDto),
            });
        }
        return ok({
            action: 'Card played',
            played: cardDto.toResponseDto(card.Card),
            nextPlayer: gamePlayerDto.toGamePlayerInfoDto(nextPlayer),
        });
    }

    /**
     * Function to end the turn of a player in a specific game
     * @param gameId : id of the game
     * @param card : Card played to end the turn
     * @param newColor : newColor to assign if the card is multicolor
     * @param mustDraw : boolean that define if the next player must draw
     * @returns next player to play
     */
    const endTurn = async ({ gameId, card, newColor, mustDraw, cardsToDraw }) => {
        const game = await gameRepository.getById(gameId);
        const players = await gamePlayerRepository.getByGameId(gameId);
        const currentPlayer = await gamePlayerRepository.getCurrentPlayerToPlay(gameId);
        let direction = game.direction;
        let color = game.currentColor;
        let skip = false;
        if (card) {
            if (card.Card.type === 'REVERSE') {
                direction = game.direction === 'RIGHT'? 'LEFT' : 'RIGHT';
                game.direction = direction;
            }
            color = card.Card.color === 'MULTICOLOR'? newColor : card.Card.color;
            if (color !== card.Card.color) {
                color = !newColor? game.currentColor : newColor;
            }
            if (card.Card.type === 'BLOCK') {
                skip = true;
            }
        }   

        const getNextPlayer = (players, currentPlayer, direction, skip) => {
            const movement = skip? 2 : 1;
            const idx = players.findIndex(p => p.playerId === currentPlayer.playerId);
            const nextIdx = direction === 'RIGHT'
                ? (idx + movement) % players.length
                : (idx - movement + players.length) % players.length;
            return players[nextIdx];
        }
        
        const nextPlayer = getNextPlayer(players, currentPlayer, direction, skip);
        await gameRepository.update(gameId, { 
            direction: direction, 
            currentPlayerIndex: nextPlayer.position, 
            currentColor: color, 
            mustDraw: mustDraw, 
            accumulatedCardsToDraw: cardsToDraw });
        return nextPlayer;
    }

    /**
     * Function to calculate the scores of the players in a game based on the cards in their hand
     * @param gameId : id of the game
     * @returns The list of the players with their updated scores
     */
    const calculateScores = async (gameId) => {
        const players = await gamePlayerRepository.getByGameId(gameId);
        const udpatedScores = await Promise.all(players.map(async p => {
            const cardsInHand = await gameCardRepository.getPlayerHand(gameId, p.playerId);
            let score = cardsInHand.reduce((acc, curr) => {
                switch(curr.Card.type) {
                    case 'NUMBER':
                        return parseInt(curr.Card.value) + acc;
                    case 'REVERSE':
                    case 'BLOCK':
                    case '+2': 
                        return 20 + acc;
                    case 'WILD':
                    case '+4':
                        return 50 + acc;
                }
            }, 0);
            return gamePlayerRepository.update(p.id, { score });
        }));
        return udpatedScores;
    }

    /**
     * Function to draw a card in a specific game
     * @param gameId : id of the game
     * @param playerId : id of the player that will draw a card
     * @returns the drawn card
     */
    const drawCard = async (gameId, playerId) => {
        
        const currentPlayer = await gamePlayerRepository.getCurrentPlayerToPlay(gameId);
        if (!currentPlayer) {
            return notFoundHelper.throwError404(playerId, 'player');
        }
        const game = await gameRepository.getByIdWithRules(gameId);
        if (game.status !== 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${gameId} is not playing`);
        }

        if (currentPlayer.playerId !== playerId) {
            return conflictHelper.throwError409(`it is not the turn for the player with ID ${playerId}`);
        }
        const hand = await gameCardRepository.getPlayerHand(gameId, playerId);
        const lastCard = await gameCardRepository.getTopCardFromDiscard(gameId);

        const result = runValidators(hasValidCardValidators, { hand, lastCard, rules: game.rules, game });
        if (result.ok) {
            return conflictHelper.throwError409(`Player with ID ${playerId} has a valid card in his hand`);
        }

        let drawnCards = [];
        let nextPlayer;
        if ((lastCard.Card.type === '+2' || lastCard.Card.type === '+4') && game.mustDraw) {
            drawnResult = await drawCards(game.accumulatedCardsToDraw, playerId, gameId);
            if (!drawnResult.ok) {
                return drawnResult;
            }
            drawnCards = drawnResult.result;
            if (currentPlayer.saidUno) {
                await gamePlayerRepository.update(currentPlayer.id, { saidUno: false });
            }
            nextPlayer = await endTurn({ gameId, mustDraw: false, cardsToDraw: 0 });
        } else {
            const drawnResult = await drawCards(1, playerId, gameId);
            if (!drawnResult.ok) {
                return drawnResult;
            }
            const drawnCard = drawnResult.result[0];
            
            if (currentPlayer.saidUno) {
                await gamePlayerRepository.update(currentPlayer.id, { saidUno: false });
            }
            const validCard = runValidators(hasValidCardValidators, { hand: [drawnCard], lastCard, rules: game.rules, game });
            if (validCard.ok) {
                return ok({
                    action: `card drawn`,
                    drawnCards: [cardDto.toResponseDto(drawnCard.Card)],
                    nextPlayer: gamePlayerDto.toGamePlayerInfoDto(currentPlayer),
                });
            } else {
                nextPlayer = await endTurn({ gameId, mustDraw: false, cardsToDraw: 0 });
                drawnCards.push(drawnCard);
            }
        }

        return ok({
            action: 'card drawn and pass turn',
            drawnCards: drawnCards.map(dc => cardDto.toResponseDto(dc.Card)),
            nextPlayer: gamePlayerDto.toGamePlayerInfoDto(nextPlayer),
        });
    }

    /**
     * Function to draw a specific cuantity of cards from the deck
     * @param cuantity : cuantity of cards that will be drawn
     * @param playerId : player that will draw
     * @param gameId : id of the game
     * @returns an ok with a list of cards
     */
    async function drawCards(cuantity, playerId, gameId) {
        const cards = [];
        for (let i = 0; i < cuantity; i++) {
            let topCardDeck = await gameCardRepository.getTopCardFromDeck(gameId);
            if (!topCardDeck) {
                const reloadResult = await reloadDeck(gameId);
                if (!reloadResult.ok) {
                    return reloadResult;
                }
            }
            topCardDeck = topCardDeck || await gameCardRepository.getTopCardFromDeck(gameId);
            const drawnCard = await gameCardRepository.update(gameId, topCardDeck.cardId, {
                zone: 'HAND',
                position: null,
                playerId: playerId,
            });
            cards.push(drawnCard);
        }
        return ok(cards);
    }

    /**
     * Function to reload the deck if there is not available cards in the deck / the deck is empty
     * @param gameId : id of the game
     * @returns ok when the deck was reloaded. err if there are still cards in the deck
     */
    const reloadDeck = async (gameId) => {
        const cardFromDeck = await gameCardRepository.getTopCardFromDeck(gameId);
        if (cardFromDeck) {
            return err(new Error(`there are still cards in the deck`));
        }
        const cards = (await gameCardRepository.getByGameId(gameId)).filter(c => c.zone === 'DISCARD')
        .toSorted((a, b) => a.position - b.position);
        const positions = getRandomNumbers(1, cards.length - 1);
        for (let i = 0; i < cards.length - 1; i++) {
            cards[i].position = positions[i];
            cards[i].zone = 'DECK';
            cards[i].playerId = null;
            await gameCardRepository.update(gameId, cards[i].cardId, cards[i]);
        }

        return ok();
    }

    /**
     * Function to allow a player say uno
     * @param gameId : id of the game
     * @param playerId : id of the player
     * @returns ok when the player was able to say uno. err if the player was not able to say uno
     */
    const sayUno = async (gameId, playerId) => {
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
        if (gamePlayer.saidUno) {
            return conflictHelper.throwError409(`player with ID ${playerId} already said uno`);
        }

        const cuantityCardsInHand = await gameCardRepository.getCuantityCardsInHand(gameId, playerId);
        if (cuantityCardsInHand > 1) {
            return conflictHelper.throwError409(`player with ID ${playerId} still has more cards`);
        }
        const udpatedPlayer = await gamePlayerRepository.update(gamePlayer.id, { saidUno: true });
        return ok({
            action: 'Said uno',
            player: gamePlayerDto.toGamePlayerInfoDto(udpatedPlayer),
        });
    }


    const challengePlayer = async (gameId, challengedPlayerId, playerIdChallenging) => {
        if (challengedPlayerId === playerIdChallenging) {
            return conflictHelper.throwError409('player cannot challenge himself');
        }
        const game = await gameRepository.getById(gameId);
        if (!game) {
            return notFoundHelper.throwError404(gameId, 'game');
        }
        if (game.status !== 'PLAYING') {
            return conflictHelper.throwError409(`game with ID ${gameId} is not playing`);
        }
        
        const challengedPlayer = await gamePlayerRepository.getByGameIdPlayerId(gameId, challengedPlayerId);
        const playerChallenging = await gamePlayerRepository.getByGameIdPlayerId(gameId, playerIdChallenging);
        if (!challengedPlayer) {
            return notFoundHelper.throwError404(challengedPlayerId, 'player challenged');
        }

        if (!playerChallenging) {
            return notFoundHelper.throwError404(playerChallenging, 'player challenging');
        }

        if (challengedPlayer.saidUno) {
            return conflictHelper.throwError409(`player with ID ${challengedPlayerId} already said uno`);
        }

        const cuantityCardsInHand = await gameCardRepository.getCuantityCardsInHand(gameId, challengedPlayerId);
        if (cuantityCardsInHand > 1) {
            return conflictHelper.throwError409(`player with ID ${challengedPlayerId} still has more cards`);
        }

        await drawCards(2, challengedPlayerId, gameId);
        return ok({
            action: `player ${challengedPlayer.Player.name} challenged`,
            challenger: gamePlayerDto.toGamePlayerInfoDto(playerChallenging),
            challengedPlayer: gamePlayerDto.toGamePlayerInfoDto(challengedPlayer),
        });
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
    
    return { distributeCards, playCard, drawCard, sayUno, reloadDeck, challengePlayer };
}
module.exports = createGameEngineService;