const express = require('express');
const router = express.Router();
const { gameEngineController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const distributeCardsSchema = require('../schemas/distribute-cards.schema');
const playCardSchema = require('../schemas/play-card.schema');
const challengeSchema = require('../schemas/challenge.schema');

router.post(
    '/games/:gameId/launch',
    authMiddleware,
    structureMiddleware(distributeCardsSchema),
    /**
     * #swagger.tags = ['GameEngine']
     * #swagger.summary = 'Start a game and deal cards atomically'
     * #swagger.description = 'The game owner starts a waiting game with at least two players. The deck is created and the initial hands are dealt in one transaction.'
     * #swagger.security = [{ "apiKeyAuth": [] }]
     * #swagger.parameters['body'] = {
         in: 'body',
         required: true,
         description: 'Number of cards per player (integer from 3 to 10)',
         '@schema': {
           type: 'object',
           required: ['cardsPerPlayer'],
           properties: {
             cardsPerPlayer: { type: 'integer', minimum: 3, maximum: 10, example: 7 }
           }
         }
       }
     * #swagger.responses[200] = {
         description: 'Game started and cards dealt successfully',
         schema: { gameId: 'game-uuid', cardsPerPlayer: 7, players: 2 }
       }
     * #swagger.responses[409] = { description: 'The game cannot be started or already has a deck' }
     * #swagger.responses[400] = { description: 'Invalid cardsPerPlayer value' }
     * #swagger.responses[404] = { description: 'Game or player not found' }
     * #swagger.responses[503] = { description: 'Card catalog is not initialized' }
     */
    gameEngineController.launchGame
);

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
       schema: { cardId: 0, newColor: "string" } 
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
