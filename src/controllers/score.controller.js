const gamePlayerService = require('../services/game-player.service');

const addScore = async (req, res) => {
    const gamePlayer = await gamePlayerService.addGamePlayer(req.body);
    res.status(201).json(gamePlayer);
}

const getScoreById = async (req, res) => {
    const { id } = req.params;
    const score = await gamePlayerService.findScoreById(id);
    res.status(200).json(score);
}

const updateScore = async (req, res) => {
    const { id } = req.params;
    const { score } = req.body;
    const newScore = await gamePlayerService.updateScore(id, score);
    res.status(200).json(newScore);
}
    
const deleteScore = async (req, res) => {
    const { id } = req.params;
    await gamePlayerService.deleteGamePlayer(id);
    res.status(204).send();
}

const getScoresByGameId = async (req, res) => {
    const { gameId } = req.params;
    const scores = await gamePlayerService.findScoresBygameId(gameId);
    res.status(200).json(scores);
}

module.exports = {
    addScore,
    updateScore,
    deleteScore,
    getScoreById,
    getScoresByGameId
}