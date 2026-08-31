/**
 * Factory to create the game card controller
 * @param gameCardService : dependency of game card service
 * @returns a literal object that contains the functions of game card controller
 */
const createGameCardController = (gameCardService) => {

    const createDeck = async (req, res, next) => {
        /**
         * #swagger.tags = ['GameCards']
         * #swagger.description = 'Initialize the cards that will use a specific game'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { gameId } = req.params;
        const result = await gameCardService.createDeck(gameId);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(201).json({
            message: "Deck created succesfully"
        })
    }

    const getCards = async (req, res, next) => {
        /**
         * #swagger.tags = ['GameCards']
         * #swagger.description = 'Get all the cards that compose a game'
         * /* #swagger.security = [{
                "apiKeyAuth": []
        }] 
         */
        const { gameId } = req.params;
        const cards = await gameCardService.getByGameId(gameId);
        if (!cards.ok) {
            return next(cards.error);
        }
        res.status(200).json(cards.result);
    }

    const updateCard = async (req, res, next) => {
        /**
         * #swagger.tags = ['GameCards']
         * #swagger.description = 'Update a specific card in the game'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         * #swagger.parameters['body'] = {
           in: 'body',
           description: 'Update card in a game',
           schema: { zone: "string", position: 0, playerId: "string" }
          }
         */
        const {gameId, cardId} = req.params;
        const card = await gameCardService.updateGameCard(gameId, cardId, req.body);
        if (!card.ok) {
            return next(card.error);
        }
        res.status(200).json(card.result);
    }

    const getTopCardFromDiscard = async (req, res, next) => {
        /**
         * #swagger.tags = ['GameCards']
         * #swagger.description = 'Get the top card of the discard from a specific game'
         */
        const { gameId } = req.params;
        const card = await gameCardService.getTopCardFromDiscard(gameId);
        if (!card.ok) {
            return next(card.error);
        }
        res.status(200).json({
            gameId: gameId,
            topCard: card.result
        });
    }

    const getPlayerHand = async (req, res, next) => {
        const { gameId } = req.params;
        const playerId = req.player.id;

        const hand = await gameCardService.getPlayerHand(gameId, playerId);
        if (!hand.ok) {
            return next(hand.error);
        }
        res.status(200).json({
            playerId: playerId,
            hand: hand.result
        });
    }

    return {
        createDeck,
        getCards,
        updateCard,
        getTopCardFromDiscard,
        getPlayerHand,
    }
}

module.exports = createGameCardController;