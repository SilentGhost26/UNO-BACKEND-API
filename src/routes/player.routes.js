const express = require('express');
const router = express.Router();
const { playerController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const playerSchema = require('../schemas/player.schema');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const playerUpdateSchema = require('../schemas/player-update.schema');

router.get(
    '/players/me', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Get a the profile of a player by its jwt token'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    playerController.getProfile
);
router.get(
    '/players/:id', 
    memoizeMiddleware({ max: 50, maxAge: 20000 }),
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Get a specific a player by its ID'
     */
    playerController.getPlayerById
);
router.put(
    '/players', 
    authMiddleware, 
    structureMiddleware(playerUpdateSchema), 
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Update a specific player'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update a player',
       schema: { name: "string", age: 0 } 
      }
     */
    playerController.updatePlayer
);
router.delete(
    '/players', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Remove a specific a player by its jwt token'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    playerController.deletePlayer
);

module.exports = router;