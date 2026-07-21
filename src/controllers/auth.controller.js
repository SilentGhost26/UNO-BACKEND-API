const authService = require('../services/auth.service');

const registerPlayer = async (req, res) => {
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'Register a new player'
     * #swagger.parameters['body'] = {
        in: 'body',
        description: 'add a player',
        schema: { name: "string", age: 0, email: "string", password: "string" }
        }
     */
    const player = await authService.registerPlayer(req.body);
    res.status(201).json(player);
}

const authenticatePlayer = async (req, res) => {
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'authenticate a player using its email and password'
     * #swagger.parameters['body'] = {
        in: 'body',
        description: 'authenticate player',
        schema: { email: "string", password: "string" }
        }
     */
    const token = await authService.authenticatePlayer(req.body.email, req.body.password);
    res.status(200).json({
        access_token: token
    });
}

const logoutPlayer = async (req, res) => {
    /**
     * #swagger.tags = ['Auth']
     * #swagger.description = 'logout a player using its token'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    await authService.logoutPlayer(req.player.id);
    res.status(200).json({
        message: "User logged out succesfully"
    });
}

module.exports = {
    registerPlayer,
    authenticatePlayer,
    logoutPlayer
}