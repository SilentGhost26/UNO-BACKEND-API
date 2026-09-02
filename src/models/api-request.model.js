const { sequelize, DataTypes } = require('../database/mysql.database');

const ApiRequest = sequelize.define(
    'ApiRequest',
    {
        responseTime: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        endpointAccess: {
        type: DataTypes.STRING,
        allowNull: false
        },
        requestMethod: {
            type: DataTypes.STRING,
            allowNull: false
        },
        statusCode: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }
);

module.exports = ApiRequest;