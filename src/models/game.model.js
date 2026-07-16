const { sequelize, DataTypes } = require('../database/mysql.database');

const Game = sequelize.define(
    'Game',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        maxPlayers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
        status: {
            type: DataTypes.ENUM('WAITING', 'PLAYING', 'FINISHED'),
            defaultValue: 'waiting',
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false    
        }
    }
);

module.exports = Game;