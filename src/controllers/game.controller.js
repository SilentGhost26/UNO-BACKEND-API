const gameService = require('../services/game.service');

const addGame = async (req, res) => {
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Add a new game'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Add a game',
       schema: { title: "string", maxPlayers: 2, status: "string" } 
      }
     * /* #swagger.security = [{
            "apiKeyAuth": []
    }] 
     */
    const gameData = {...req.body, ownerId: req.player.id};
    const game = await gameService.addGame(gameData);
    res.status(201).json(game);
}

const getGameById = async (req, res) => {
     /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Get a specific a game by its ID'
     */
    const { id } = req.params;
    const game = await gameService.findGameById(id);
    res.status(200).json(game);
}

const updateGame = async (req, res) => {
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
    res.status(200).json(game);
}
    
const deleteGame = async (req, res) => {
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Remove a specific a game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const { id } = req.params;
    await gameService.deleteGame(id);
    res.status(204).send();
}

const startGame = async (req, res) => {
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'Start a specific a game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const gameId = req.params.id;
    const playerId = req.player.id;
    await gameService.startGame(gameId, playerId);
    res.status(200).json({
        message: "Game started succesfully"
    })
}

const finishGame = async (req, res) => {
    /**
     * #swagger.tags = ['Games']
     * #swagger.description = 'finish a specific a game by its ID'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const gameId = req.params.id;
    const playerId = req.player.id;
    await gameService.finishGame(gameId, playerId);
    res.status(200).json({
        message: "Game ended succesfully"
    })
}
module.exports = {
    addGame,
    getGameById,
    updateGame,
    deleteGame,
    startGame,
    finishGame
}
