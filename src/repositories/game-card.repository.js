const GameCard = require('../models/game-card.model');
const Game = require('../models/game.model');
const Card = require('../models/card.model');

const create = async (gameCardData) => {
    if (!gameCardData) {
        throw new Error('gameCardData cannot be null');
    }
    return await GameCard.create(gameCardData);
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
    const card = await GameCard.findOne({
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
    if (!card || card.isDeleted) {
        return null;
    }

    return await card.update(gameCardData);
}

const findAll = async () => {
    return await GameCard.findAll({
        where: {
            isDeleted: false
        }
    });
}

module.exports = {
    create,
    getByIds,
    update,
    findAll
}