const { sequelize, DataTypes } = require('../database/mysql.database');

const History = sequelize.define(
    'History',
    {
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }
);

module.exports = History;