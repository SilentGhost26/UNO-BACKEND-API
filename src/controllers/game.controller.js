const gameService = require('../services/game.service');

const addGame = async (req, res) => {
    const game = await gameService.addGame(req.body);
    res.status(201).json(game)
}

const getGameById = async (req, res) => {
    const { id } = req.params;
    const game = await gameService.findGameById(id);
    res.status(200).json(game);
}

const updateGame = async (req, res) => {
    const { id } = req.params;
    const game = await gameService.updateGame(id, req.body);
    res.status(200).json(game);
}
    
const deleteGame = async (req, res) => {
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