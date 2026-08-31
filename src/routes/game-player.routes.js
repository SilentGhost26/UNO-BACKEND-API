const express = require('express');
const router = express.Router();
const { gamePlayerController } = require('../compositions');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

router.post(
    '/games/:gameId/players', 
    authMiddleware, 
    /**
     * #swagger.tags = ['GamePlayers']
     * #swagger.description = 'Add a new player in a game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gamePlayerController.addGamePlayer
);
router.delete(
    '/games/:gameId/players', 
    authMiddleware, 
    /**
     * #swagger.tags = ['GamePlayers']
     * #swagger.description = 'Remove player from a game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gamePlayerController.removeGamePlayer
);
router.get(
    '/games/:gameId/players', 
    memoizeMiddleware({ max: 100, maxAge: 5000 }),
    /**
     * #swagger.tags = ['GamePlayers']
     * #swagger.description = 'Get the players that are in a game'
     */
    gamePlayerController.getPlayersInGame
);
router.get(
    '/games/:gameId/players/current', 
    memoizeMiddleware({ max: 100, maxAge: 2000 }),
    /**
     * #swagger.tags = ['GamePlayers']
     * #swagger.description = 'Get the current player in the turn to play'
     */
    gamePlayerController.getCurrentPlayerToPlay
);

module.exports = router;