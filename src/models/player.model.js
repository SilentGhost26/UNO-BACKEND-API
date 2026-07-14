const { sequelize, DataTypes } = require('../database/mysql.database');

const Player = sequelize.define(
    'Player',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
});

module.exports = Player;