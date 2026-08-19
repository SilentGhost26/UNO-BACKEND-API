const express = require('express');
const router = express.Router();
const { gamePlayerController } = require('../compositions');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/games/:gameId/players', authMiddleware, gamePlayerController.addGamePlayer);
router.delete('/games/:gameId/players', authMiddleware, gamePlayerController.removeGamePlayer);
router.get('/games/:gameId/players', gamePlayerController.getPlayersInGame);
router.get('/games/:gameId/players/current', gamePlayerController.getCurrentPlayerToPlay);

module.exports = router;