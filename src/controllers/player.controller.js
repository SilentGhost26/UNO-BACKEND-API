const playerService = require('../services/player.service');

const addPlayer = async (req, res) => {
    const player = await playerService.addPlayer(req.body);
    res.status(201).json(player)
}

const getPlayerById = async (req, res) => {
    const { id } = req.params;
    const player = await playerService.findPlayerById(id);
    res.status(200).json(player);
}

const updatePlayer = async (req, res) => {
    const { id } = req.params;
    const player = await playerService.updatePlayer(req.body);
    res.status(200).json(player);
}
    
const deletePlayer = async (req, res) => {
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