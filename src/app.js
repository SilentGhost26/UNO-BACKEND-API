const express = require('express');
const app = express();
const playerRoutes = require('./routes/player.routes');


app.use(express.json())
app.use('/', playerRoutes);

module.exports = app;