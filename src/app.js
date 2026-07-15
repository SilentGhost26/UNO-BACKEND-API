const express = require('express');
const app = express();
const playerRoutes = require('./routes/player.routes');
const gameRoutes = require('./routes/game.routes');
const errorMiddleware = require('./middlewares/error.middleware');

app.use(express.json())
app.use('/', playerRoutes);
app.use('/', gameRoutes);
app.use(errorMiddleware);

module.exports = app;