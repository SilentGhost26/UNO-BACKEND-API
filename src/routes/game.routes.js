const express = require('express');
const router = express.Router();
const { gameController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const gameSchema = require('../schemas/game.schema');

router.get(
    '/games/:id/status', 
    memoizeMiddleware({ max: 100, maxAge: 1500 }),
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Get the status of a game by its ID'
     */
    gameController.getGameStatus
);
router.get(
    '/games/:id',
    memoizeMiddleware({ max: 100, maxAge: 5000 }),
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Get a specific game by its ID'
     */
    gameController.getGameByIdWithRules
);
router.post(
    '/games', 
    authMiddleware, 
    structureMiddleware(gameSchema), 
    /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Add a new game'
         * #swagger.parameters['body'] = {
           in: 'body',
           description: 'Add a game',
           schema: { 
                title: "string", 
                maxPlayers: 2, 
                rules: {
                        allowDrawFour: true,
                        allowAccumulateDraw: false,
                        allowReverse: true,
                    } 
                } 
          }
         * /* #swagger.security = [{
                "apiKeyAuth": []
        }] 
         */
    gameController.addGame
);
router.put(
    '/games/:id', 
    authMiddleware, 
    structureMiddleware(gameSchema), 
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Update a specific game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update a game',
       schema: { 
                title: "string", 
                maxPlayers: 2, 
                rules: {
                        allowDrawFour: true,
                        allowAccumulateDraw: false,
                        allowReverse: true,
                    } 
                } 
          }
      }
     */
    gameController.updateGame
);
router.put(
    '/games/:id/start', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Start a specific game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameController.startGame
);
router.put(
    '/games/:id/end', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'finish a specific game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameController.finishGame
);
router.delete(
    '/games/:id', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Remove a specific game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameController.deleteGame
);

module.exports = router;