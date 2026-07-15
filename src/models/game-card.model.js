const { sequelize, DataTypes } = require('../database/mysql.database');

const GameCard = sequelize.define(
    'GameCard',
    {
        zone: {
            type: DataTypes.ENUM('DECK', 'HAND', 'DISCARD'),
            allowNull: false
        }
    }
);

GameCard.removeAttribute('id');

module.exports = GameCard;