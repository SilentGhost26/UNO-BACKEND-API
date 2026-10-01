const createLaunchGameService = (repository, gameStartValidators, deckValidators, { runValidators, ok, err }) => {
    const launchGame = async (gameId, playerId, cardsPerPlayer) => {
        try {
            const result = await repository.inTransaction(async (transaction) => {
                const game = await repository.getGameForUpdate(gameId, transaction);
                const currentPlayers = game ? await repository.getPlayers(gameId, transaction) : [];
                const player = await repository.getPlayer(playerId, transaction);
                const validation = runValidators(gameStartValidators, { game, gameId, currentPlayers, player, playerId });
                if (!validation.ok) throw validation.error;

                const rules = await repository.getRules(gameId, transaction);
                const existingCards = await repository.countGameCards(gameId, transaction);
                if (!rules || existingCards) {
                    const error = new Error('Game deck is not available for initialization');
                    error.statusCode = 409;
                    throw error;
                }

                const catalog = await repository.getCards(transaction);
                if (!catalog.length) {
                    const error = new Error('Cards are not initialized');
                    error.statusCode = 503;
                    throw error;
                }
                const deck = catalog.filter(card => runValidators(deckValidators, { card, rules }).ok);
                if (deck.length < currentPlayers.length * cardsPerPlayer + 1 || !deck.some(card => card.type === 'NUMBER')) {
                    const error = new Error('Not enough cards to start the game');
                    error.statusCode = 409;
                    throw error;
                }

                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }

                const topIndex = deck.findIndex(card => card.type === 'NUMBER');
                const [topCard] = deck.splice(topIndex, 1);
                const gameCards = [{ gameId, cardId: topCard.id, zone: 'DISCARD', position: 1, playerId: null }];
                for (let round = 0; round < cardsPerPlayer; round++) {
                    for (const playingPlayer of currentPlayers) {
                        const card = deck.pop();
                        gameCards.push({ gameId, cardId: card.id, zone: 'HAND', position: null, playerId: playingPlayer.playerId });
                    }
                }
                deck.forEach((card, index) => gameCards.push({
                    gameId, cardId: card.id, zone: 'DECK', position: index + 2, playerId: null,
                }));

                await repository.createGameCards(gameCards, transaction);
                await repository.updateGame(game, {
                    status: 'PLAYING', distributedCards: true, currentColor: topCard.color,
                }, transaction);
                return { gameId, cardsPerPlayer, players: currentPlayers.length };
            });
            return ok(result);
        } catch (error) {
            return err(error);
        }
    };

    return { launchGame };
};

module.exports = createLaunchGameService;
