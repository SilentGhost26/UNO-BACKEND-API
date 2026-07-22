const playerService = require('../services/player.service');

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
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
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
     * #swagger.description = 'Remove a specific a player by its jwt token'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const { id } = req.player;
  
    await playerService.deletePlayer(id);
    res.status(204).send();
}

const getProfile = async (req, res) => {
    /**
     * #swagger.tags = ['Players']
     * #swagger.description = 'Get a the profile of a player by its jwt token'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const { id } = req.player;
    const player = await playerService.findPlayerById(id);
    res.status(200).json(player);
}

module.exports = {
    addPlayer,
    getPlayerById,
    updatePlayer,
    deletePlayer,
    getProfile
}