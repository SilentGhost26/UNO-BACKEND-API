const express = require('express');
const cors = require('cors');
const app = express();
const playerRoutes = require('./routes/player.routes');
const gameRoutes = require('./routes/game.routes');
const cardRoutes = require('./routes/card.routes');
const scoreRoutes = require('./routes/score.routes');
const gameCardRoutes = require('./routes/game-card.routes');
const gamePlayerRoutes = require('./routes/game-player.routes');
const authRoutes = require('./routes/auth.routes');
const gameEngineRoutes = require('./routes/game-engine.routes');
const historyRoutes = require('./routes/history.routes');
const requestStatsRoutes = require('./routes/request-stats.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const trackingMiddleware = require('./middlewares/tracking.middleware');

app.use(express.json());
app.use(cors({
    origin: process.env.FRONT_END_URL,
}));
app.use('/', requestStatsRoutes);
app.use(trackingMiddleware);
app.use('/', playerRoutes);
app.use('/', gameRoutes);
app.use('/', cardRoutes);
app.use('/', gameCardRoutes);
app.use('/', scoreRoutes);
app.use('/', gamePlayerRoutes);
app.use('/', authRoutes);
app.use('/', gameEngineRoutes);
app.use('/', historyRoutes);
app.use(errorMiddleware);

module.exports = app;