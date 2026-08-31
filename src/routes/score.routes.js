const express = require('express');
const router = express.Router();
const { scoreController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const scoreSchema = require('../schemas/score.schema');
const gamePlayerSchema = require('../schemas/game-player.schema');

router.get(
    '/scores/:id', 
    memoizeMiddleware({ max: 100, maxAge: 1000 }),
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Get a specific a score by its ID'
     */
    scoreController.getScoreById
);
router.get(
    '/scores/games/:gameId', 
    memoizeMiddleware({ max: 200, maxAge: 2000 }),
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Get a the scores of the players in a specific game'
     */
    scoreController.getScoresByGameId
);
router.put(
    '/scores/:id', 
    authMiddleware, 
    structureMiddleware(scoreSchema), 
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Update a specific a score by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update a score',
       schema: { score: 0 } 
      }
     */
    scoreController.updateScore
);

module.exports = router;