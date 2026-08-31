const express = require('express');
const router = express.Router();
const { gameCardController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const gameCardSchema = require('../schemas/game-card.schema');

router.post(
    '/games/:gameId/cards', 
    authMiddleware, 
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Initialize the cards that will use a specific game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameCardController.createDeck
);
router.get(
    '/games/:gameId/cards', 
    memoizeMiddleware({ max: 100, maxAge: 2000 }),
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Get all the cards that compose a game'
     * /* #swagger.security = [{
            "apiKeyAuth": []
    }] 
     */
    gameCardController.getCards
);
router.get(
    '/games/:gameId/cards/top-card', 
    memoizeMiddleware({ max: 100, maxAge: 2000 }),
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Get the top card of the discard from a specific game'
     */
    gameCardController.getTopCardFromDiscard
);
router.get(
    '/games/:gameId/cards/hand', 
    authMiddleware,
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Get the hand of a player in a specific game'
     */
    gameCardController.getPlayerHand
);
router.put(
    '/games/:gameId/cards/:cardId', 
    authMiddleware, 
    structureMiddleware(gameCardSchema), 
    /**
     * #swagger.tags = ['GameCards']
     * #swagger.description = 'Update a specific card in the game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update card in a game',
       schema: { zone: "string", position: 0, playerId: "string" }
      }
     */
    gameCardController.updateCard);

module.exports = router;