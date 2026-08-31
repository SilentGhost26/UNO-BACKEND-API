const express = require('express');
const router = express.Router();
const { gameEngineController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const distributeCardsSchema = require('../schemas/distribute-cards.schema');
const playCardSchema = require('../schemas/play-card.schema');
const challengeSchema = require('../schemas/challenge.schema');

router.post(
    '/games/:gameId/distribute', 
    authMiddleware,
    structureMiddleware(distributeCardsSchema),
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.description = 'Distribute the cards in a game between the players'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'distribute cards',
       schema: { cardsPerPlayer: 0 } 
      }
     * /* #swagger.security = [{
            "apiKeyAuth": []
    }] 
     */
    gameEngineController.distributeCards
);

router.put(
    '/games/:gameId/play',
    authMiddleware,
    structureMiddleware(playCardSchema),
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.description = 'Play a card from the hand. Put a color if the card is multicolor'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Play a card',
       schema: { cardId: "string", newColor: "string" } 
      }
     */
    gameEngineController.playCard
);

router.put(
    '/games/:gameId/draw',
    authMiddleware,
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.description = 'Draw a card from the deck.'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameEngineController.drawCard
);

router.patch(
    '/games/:gameId/say-uno',
    authMiddleware,
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.description = 'Say uno.'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    gameEngineController.sayUno
);

router.post(
    '/games/:gameId/challenge',
    authMiddleware,
    structureMiddleware(challengeSchema),
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.description = 'Challenge another player when he has not said uno'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Challenge a player',
       schema: { challengedPlayerId: "string" } 
      }
     */
    gameEngineController.challengePlayer
);

module.exports = router;