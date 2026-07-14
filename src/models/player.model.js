const { sequelize, DataType } = require('../database/mysql.database');

const Player = sequelize.define(
    'Player',
    {
        id: {
            type: DataType.UUID,
            defaultValue: DataType.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataType.STRING,
            allowNull: false
        },
        age: {
            type: DataType.INTEGER,
            allowNull: false
        },
        email: {
            type: DataType.STRING,
            allowNull: false
        },
        isDeleted: {
            type: DataType.BOOLEAN,
            defaultValue: false
        }
});

module.exports = Player;