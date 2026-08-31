const { sequelize, DataTypes } = require('../database/mysql.database');

const GamePlayer = sequelize.define(
    'GamePlayer',
    {   
        score: {
            type: DataTypes.INTEGER(),
            defaultValue: 0,
            allowNull: false
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        saidUno: {
            type: DataTypes.BOOLEAN(),
            defaultValue: false,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN(),
            defaultValue: false,
            allowNull: false
        }
    }
);

module.exports = GamePlayer;

