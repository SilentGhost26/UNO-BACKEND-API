const { sequelize } = require('../database/mysql.database');
const Game = require('../models/game.model');
const GamePlayer = require('../models/game-player.model');
const Player = require('../models/player.model');
const Rules = require('../models/rules.model');
const Card = require('../models/card.model');
const GameCard = require('../models/game-card.model');

const inTransaction = (work) => sequelize.transaction(work);

const getGameForUpdate = async (gameId, transaction) => {
    const game = await Game.findByPk(gameId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
    return game && !game.isDeleted ? game : null;
};

const getPlayers = (gameId, transaction) => GamePlayer.findAll({
    where: { gameId, isDeleted: false },
    order: [['position', 'ASC']],
    transaction,
});

const getPlayer = (playerId, transaction) => Player.findOne({
    where: { id: playerId, isDeleted: false },
    transaction,
});

const getRules = (gameId, transaction) => Rules.findOne({ where: { gameId }, transaction });
const getCards = (transaction) => Card.findAll({ where: { isDeleted: false }, transaction });
const countGameCards = (gameId, transaction) => GameCard.count({ where: { gameId }, transaction });
const createGameCards = (cards, transaction) => GameCard.bulkCreate(cards, { transaction });
const updateGame = (game, values, transaction) => game.update(values, { transaction });

module.exports = {
    inTransaction,
    getGameForUpdate,
    getPlayers,
    getPlayer,
    getRules,
    getCards,
    countGameCards,
    createGameCards,
    updateGame,
};
