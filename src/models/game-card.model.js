const { sequelize, DataTypes } = require('../database/mysql.database');

const GameCard = sequelize.define(
    'GameCard',
    {
        gameId: {
        type: DataTypes.UUID,
        primaryKey: true
        },
        cardId: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        zone: {
            type: DataTypes.ENUM('DECK', 'HAND', 'DISCARD'),
            allowNull: false
        },
        position: {
            type: DataTypes.INTEGER
        }
    }
);

GameCard.removeAttribute('id');

module.exports = GameCard;