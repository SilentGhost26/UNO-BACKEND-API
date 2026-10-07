const { sequelize, DataTypes } = require('../database/mysql.database');

const log = sequelize.define(
    'Log',
    {
        level: {
            type: DataTypes.ENUM('ERROR', 'WARNING', 'INFO'),
            allowNull: false,
            defaultValue: 'INFO',
        },
        category: {
            type: DataTypes.STRING,
        },
        event: {
            type: DataTypes.STRING,
        },
        message: { 
            type: DataTypes.TEXT,
        },
        source: { 
            type: DataTypes.STRING,
        }, 
        statusCode: { 
            type: DataTypes.INTEGER,
        },
        playerId: { 
            type: DataTypes.UUID,
        },
        gameId: { 
            type: DataTypes.UUID,
        },
        metadata: { 
            type: DataTypes.JSON, 
        },
    }
);

module.exports = log;