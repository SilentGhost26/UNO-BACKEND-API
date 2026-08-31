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
            defaultValue: 'WAITING',
            allowNull: false
        },
        distributedCards: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        direction: {
            type: DataTypes.ENUM('LEFT', 'RIGHT'),
            defaultValue: 'RIGHT',
            allowNull: false,
        },
        currentPlayerIndex: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        currentColor: {
            type: DataTypes.ENUM('YELLOW', 'RED', 'GREEN', 'BLUE'),
            allowNull: true
        },
        mustDraw: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false    
        },
        accumulatedCardsToDraw: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false    
        },
        
    }
);

module.exports = Game;