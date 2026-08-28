/**
 * Factory to create the auth controller
 * @param authService : dependency of auth service
 * @returns a literal object that contains the functions of auth controller
 */
const createAuthController = (authService) => {

    const registerPlayer = async (req, res, next) => {
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
       if (!player.ok) {
           return next(player.error);
       }
       res.status(201).json(player.result);
    }
    
    const authenticatePlayer = async (req, res, next) => {
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
       if (!token.ok) {
           return next(token.error);
       }
       res.status(200).json({
           access_token: token.result.token,
           playerId: token.result.playerId,
        });
    }
    
    const logoutPlayer = async (req, res, next) => {
        /**
         * #swagger.tags = ['Auth']
         * #swagger.description = 'logout a player using its token'
         * #swagger.security = [{
        "apiKeyAuth": []
        }] 
        */
       const result = await authService.logoutPlayer(req.player.id);
       if (!result.ok) {
           return next(result.error);
       }
       res.status(200).json({
           message: "User logged out succesfully"
        });
    }
    
    return { registerPlayer, authenticatePlayer, logoutPlayer };
}

module.exports = createAuthController;