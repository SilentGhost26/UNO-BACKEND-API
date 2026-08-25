const express = require('express');
const router = express.Router();
const { authController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const playerSchema = require('../schemas/player.schema');
const loginSchema = require('../schemas/login.schema');

router.post(
    '/auth/register', 
    structureMiddleware(playerSchema), 
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'Register a new player'
     * #swagger.parameters['body'] = {
    in: 'body',
    description: 'add a player',
    schema: { name: "string", age: 0, email: "string", password: "string" }
    }
    */
    authController.registerPlayer
);
router.post(
    '/auth/login', 
    structureMiddleware(loginSchema), 
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'authenticate a player using its email and password'
     * #swagger.parameters['body'] = {
    in: 'body',
    description: 'authenticate player',
    schema: { email: "string", password: "string" }
    }
    */
    authController.authenticatePlayer
);
router.post(
    '/auth/logout', 
    authMiddleware, 
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'logout a player using its token'
     * #swagger.security = [{
    "apiKeyAuth": []
    }] 
    */
    authController.logoutPlayer
);

module.exports = router;