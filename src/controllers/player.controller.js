const playerService = require('../services/player.service');

const addPlayer = async (req, res) => {
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Add a new player'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Add a player',
       schema: { name: "string", age: 0, email: "string", password: "string" } 
      }
     */
    const player = await playerService.addPlayer(req.body);
    res.status(201).json(player);
}

const getPlayerById = async (req, res) => {
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Get a specific a player by its ID'
     */
    const { id } = req.params;
    const player = await playerService.findPlayerById(id);
    res.status(200).json(player);
}

const updatePlayer = async (req, res) => {
     /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Update a specific player'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update a player',
       schema: { name: "string", age: 0, email: "string" } 
      }
     */
    const { id } = req.params;
    const player = await playerService.updatePlayer(id, req.body);
    res.status(200).json(player);
}
    
const deletePlayer = async (req, res) => {
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Remove a specific a player by its ID'
     */
    const { id } = req.params;
    await playerService.deletePlayer(id);
    res.status(204).send();
}

module.exports = {
    addPlayer,
    getPlayerById,
    updatePlayer,
    deletePlayer
}