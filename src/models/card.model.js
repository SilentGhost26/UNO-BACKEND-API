const { sequelize, DataTypes } = require('../database/mysql.database');

const Card = sequelize.define(
    'Card',
    {
        color: {
            type: DataTypes.ENUM('GREEN', 'BLUE', 'YELLOW', 'RED', 'MULTICOLOR'),
            allowNull: false
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('NUMBER', 'BLOCK', 'REVERSE', '+2', '+4', 'WILD'),
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
);

module.exports = Card;