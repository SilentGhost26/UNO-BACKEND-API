const express = require('express');
const app = express();
const playerRoutes = require('./routes/player.routes');
const gameRoutes = require('./routes/game.routes');

app.use(express.json())
app.use('/', playerRoutes);
app.use('/', gameRoutes);

module.exports = app;