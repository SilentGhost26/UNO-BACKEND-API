const express = require('express');
const app = express();
const playerRoutes = require('./routes/player.routes');
const gameRoutes = require('./routes/game.routes');
const cardRoutes = require('./routes/card.routes');
const gameCardRoutes = require('./routes/game-card.routes');
const errorMiddleware = require('./middlewares/error.middleware');

app.use(express.json())
app.use('/', playerRoutes);
app.use('/', gameRoutes);
app.use('/', cardRoutes);
app.use('/', gameCardRoutes);
app.use(errorMiddleware);

module.exports = app;