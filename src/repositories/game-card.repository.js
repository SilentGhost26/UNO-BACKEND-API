const GameCard = require('../models/game-card.model');
const Game = require('../models/game.model');
const Card = require('../models/card.model');

const create = async (gameCardData) => {
    if (!gameCardData) {
        throw new Error('gameCardData cannot be null');
    }

    return await GameCard.create(gameCardData);
}

const bulkCreate = async (gameCardsData) => {
    if (!gameCardsData) {
        throw new Error('gameCardData cannot be null');
    }
    if (!Array.isArray(gameCardsData)) {
        throw new Error('gameCardsData must be a list');
    }

    return await GameCard.bulkCreate(gameCardsData);
}

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

const findAll = async () => {
    return await GameCard.findAll({
        where: {
            isDeleted: false
        }
    });
}

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

module.exports = {
    create,
    getByIds,
    update,
    findAll,
    bulkCreate,
    getByGameId
}