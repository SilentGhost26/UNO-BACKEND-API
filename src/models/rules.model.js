const { sequelize, DataTypes } = require('../database/mysql.database');

const Rules = sequelize.define(
    'Rules',
    {
        allowDrawFour: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        allowAccumulateDraw: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        allowReverse: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
    }
);

module.exports = Rules;