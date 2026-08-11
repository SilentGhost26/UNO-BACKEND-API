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
     */
    const game = await gameService.addGame(req.body);
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
     */
    const { id } = req.params;
    await gameService.deleteGame(id);
    res.status(204).send();
}
module.exports = {
    addGame,
    getGameById,
    updateGame,
    deleteGame
}