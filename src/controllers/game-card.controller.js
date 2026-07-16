const gameCardService = require('../services/game-card.service');

const createDeck = async (req, res) => {
    const { gameId } = req.params;
    await gameCardService.createDeck(gameId);
    res.status(201).json({
        message: "Deck created succesfully"
    })
}

const getCards = async (req, res) => {
    const { gameId } = req.params;
    const cards = await gameCardService.getByGameId(gameId);
    res.status(200).json(cards);
}

const updateCard = async (req, res) => {
    const {gameId, cardId} = req.params;
    const card = await gameCardService.updateGameCard(gameId, cardId, req.body);
    res.status(200).json(card);
}

module.exports = {
    createDeck,
    getCards,
    updateCard
}