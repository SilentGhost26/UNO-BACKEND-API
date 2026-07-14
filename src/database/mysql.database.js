const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    dialect: "mysql"
});

module.exports = {
    sequelize,
    DataTypes
}