const GameCard = require('../models/game-card.model');
const Game = require('../models/game.model');
const Card = require('../models/card.model');

/**
 * Create a gameCard in the database
 * @param gameCardData : gameCard that will be created
 * @returns the created card
 */
const create = async (gameCardData) => {
    if (!gameCardData) {
        throw new Error('gameCardData cannot be null');
    }

    return await GameCard.create(gameCardData);
}

/**
 * Create a group of gameCards in the database
 * @param cards : gameCards that will be created
 * @returns : A list of the all created gameCards
 */
const bulkCreate = async (gameCardsData) => {
    if (!gameCardsData) {
        throw new Error('gameCardData cannot be null');
    }
    if (!Array.isArray(gameCardsData)) {
        throw new Error('gameCardsData must be a list');
    }

    return await GameCard.bulkCreate(gameCardsData);
}

/**
 * Get a gameCard from a specific game and card
 * @param gameId : id of the game
 * @param {*} cardId : id of the card
 * @returns the gameCard found
 */
const getByIds = async (gameId, cardId) => {
    const gameCard = await GameCard.findOne({
        where: {
            gameId: gameId,
            cardId: cardId
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false }
        },
        {
            model: Card,
            where: { isDeleted: false }
        }
        ]
    });
    if(!gameCard) {
        return null;
    }

    return gameCard;
}
/**
 * Update a specific card in the database
 * @param gameId : id of the game
 * @param cardId : id of the card
 * @param gameCardData : values that will be updated
 * @returns The gameCard updated
 */
const update = async (gameId, cardId, gameCardData) => {
    if (!gameCardData) {
        throw new Error('gameCardData cannot be null');
    }
    const gameCard = await GameCard.findOne({
        where: {
            gameId: gameId,
            cardId: cardId
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false }
        },
        {
            model: Card,
            where: { isDeleted: false }
        }
        ]
    });
    if (!gameCard) {
        return null;
    }

    return await gameCard.update(gameCardData);
}

/**
 * Get all gameCards in the database
 * @returns A list of all gameCards
 */
const findAll = async () => {
    return await GameCard.findAll({
        where: {
            isDeleted: false
        }
    });
}

/**
 * Get the gameCards from a specific game
 * @param  gameId : id of the game
 * @returns A list of the gameCards found
 */
const getByGameId = async (gameId) => {
    return await GameCard.findAll({
        where: {
            gameId: gameId
        },
        include: [
        {
            model: Game,
            where: { isDeleted: false, }
        },
        {
            model: Card,
            where: { isDeleted: false }
        }
        ]
    });
}

/**
 * Get the top card in the discard of a specific game
 * @param gameId : id of the game
 * @returns the top card
 */
const getTopCardFromDiscard = async (gameId) => {
    const card = await GameCard.findOne({
        where: {
            gameId: gameId,
            zone: 'DISCARD',
        },
        limit: 1,
        order: [['position', 'DESC']],
        include: [
            {
                model: Card
            }
        ]
    });
    if (!card) {
        return null;
    }

    return card;
}

/**
 * Get the hand of a player
 * @param gameId : id of the game
 * @param playerId : id of the player 
 */
const getPlayerHand = async (gameId, playerId) => {
    const cards = await GameCard.findAll({
        where: {
            gameId: gameId,
            playerId: playerId,
        },
        include: [
            {
                model: Card
            }
        ]
    });

    return cards;
}

/**
 * Get the top card in the deck of a specific game
 * @param gameId : id of the game
 * @returns the top card
 */
const getTopCardFromDeck = async (gameId) => {
    const card = await GameCard.findOne({
        where: {
            gameId: gameId,
            zone: 'DECK',
        },
        limit: 1,
        order: [['position', 'DESC']],
        include: [
            {
                model: Card
            }
        ]
    });
    if (!card) {
        return null;
    }

    return card;
}

/**
 * Gets the cuantity of cards that a player has in his hand
 * @param gameId : id of game where the player is playing
 * @param playerId : id of the player
 * @returns the cuantity of cards in hand
 */
const getCuantityCardsInHand = async (gameId, playerId) => {
    return await GameCard.count({
        where: {
            gameId: gameId,
            playerId: playerId,
            zone: 'HAND',
        }
    });
}

module.exports = {
    create,
    getByIds,
    update,
    findAll,
    bulkCreate,
    getByGameId,
    getTopCardFromDiscard,
    getPlayerHand,
    getTopCardFromDeck,
    getCuantityCardsInHand,
}