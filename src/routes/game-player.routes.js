const express = require('express');
const router = express.Router();
const gamePlayerController = require('../controllers/game-player.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/games/:gameId/players', authMiddleware, gamePlayerController.addGamePlayer);
router.delete('/games/:gameId/players', authMiddleware, gamePlayerController.removeGamePlayer);
router.get('/games/:gameId/players', gamePlayerController.getPlayersInGame);

module.exports = router;