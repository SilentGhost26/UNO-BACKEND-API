/**
 * Factory to create the game controller
 * @param gameService : dependency of game service
 * @returns a literal object that contains the functions of game controller
 */
const createGameController = (gameService) => {

    const addGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Add a new game'
         * #swagger.parameters['body'] = {
           in: 'body',
           description: 'Add a game',
           schema: { 
                title: "string", 
                maxPlayers: 2, 
                status: "string",
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
        const gameData = {...req.body, ownerId: req.player.id};
        const game = await gameService.addGame(gameData);
        if (!game.ok) {
            return next(game.error);
        }
        res.status(201).json(game.result);
    }

    const getGameById = async (req, res, next) => {
         /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Get the status of a game by its ID'
         */
        const { id } = req.params;
        const game = await gameService.findGameById(id);
        if (!game.ok) {
            return next(game.error);
        }
        res.status(200).json(game.result);
    }

    const getGameByIdWithRules = async (req, res, next) => {
         /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Get a specific a game by its ID'
         */
        const { id } = req.params;
        const game = await gameService.findGameByIdWithRules(id);
        if (!game.ok) {
            return next(game.error);
        }
        res.status(200).json(game.result);
    }

    const updateGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Update a specific game'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         * #swagger.parameters['body'] = {
           in: 'body',
           description: 'Update a game',
           schema: { title: "string", maxPlayers: 2, status: "string" } 
          }
         */
        const { id } = req.params;
        const game = await gameService.updateGame(id, req.body);
        if (!game.ok) {
            return next(game.error);
        }
        res.status(200).json(game.result);
    }
        
    const deleteGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Remove a specific a game by its ID'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { id } = req.params;
        const result = await gameService.deleteGame(id);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(204).send();
    }

    const startGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Start a specific a game by its ID'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const gameId = req.params.id;
        const playerId = req.player.id;
        const result = await gameService.startGame(gameId, playerId);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(200).json({
            message: "Game started succesfully"
        })
    }

    const finishGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'finish a specific a game by its ID'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const gameId = req.params.id;
        const playerId = req.player.id;
        const result = await gameService.finishGame(gameId, playerId);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(200).json({
            message: "Game ended succesfully"
        })
    }

    const getGameStatus = async (req, res, next) => {
         /**
         * #swagger.tags = ['Games']
         * #swagger.description = 'Get the status of a game by its ID'
         */
        const { id } = req.params;
        const game = await gameService.getGameStatus(id);
        if (!game.ok) {
            return next(game.error);
        }
        res.status(200).json(game.result);
    }

    return {
        addGame,
        getGameById,
        updateGame,
        deleteGame,
        startGame,
        finishGame,
        getGameByIdWithRules,
        getGameStatus
    }
}

module.exports = createGameController;
