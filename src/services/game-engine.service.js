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
        const distributedCards = distribute(players, sortedCards, cardsPerPlayer, []);
        let updatedCards = [];
        await Promise.all(distributedCards.map(c => gameCardRepository.update(c.gameId, c.cardId, c.dataValues)))
        .then(result => updatedCards = result);
        
        await gameRepository.update(gameId, { distributedCards: true })
        
        const v = ok(players.map(p => {
            const cards = updatedCards.filter(c => c.playerId == p.playerId).map(c => cardDto.toResponseDto(c.Card));
            p.cardsInHand = cards;
            return gameCardDto.toHandResponseDto(p); 
        }));
        
        
        return v;
    }
    
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
    
    return { distributeCards };
}
module.exports = createGameEngineService;