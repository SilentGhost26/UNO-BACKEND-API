const gameCardService = require('../services/game-card.service');

const createDeck = async (req, res) => {
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Initialize the cards that will use a specific game'
     */
    const { gameId } = req.params;
    await gameCardService.createDeck(gameId);
    res.status(201).json({
        message: "Deck created succesfully"
    })
}

const getCards = async (req, res) => {
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Get all the cards that compose a game'
     * /* #swagger.security = [{
            "apiKeyAuth": []
    }] 
     */
    const { gameId } = req.params;
    const cards = await gameCardService.getByGameId(gameId);
    res.status(200).json(cards);
}

const updateCard = async (req, res) => {
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Update a specific card in the game'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update card in a game',
       schema: { zone: "string", position: 0, playerId: "string" }
      }
     */
    const {gameId, cardId} = req.params;
    const card = await gameCardService.updateGameCard(gameId, cardId, req.body);
    res.status(200).json(card);
}

module.exports = {
    createDeck,
    getCards,
    updateCard
}