const gamePlayerService = require('../services/game-player.service');

const addScore = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Add a new score for a player in a game'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Add a score',
       schema: { playerId: "string", gameId: "string" } 
      }
     */
    const gamePlayer = await gamePlayerService.addGamePlayer(req.body);
    res.status(201).json(gamePlayer);
}

const getScoreById = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Get a specific a score by its ID'
     */
    const { id } = req.params;
    const score = await gamePlayerService.findScoreById(id);
    res.status(200).json(score);
}

const updateScore = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Update a specific a score by its ID'
     * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Update a score',
       schema: { score: 0 } 
      }
     */
    const { id } = req.params;
    const { score } = req.body;
    const newScore = await gamePlayerService.updateScore(id, score);
    res.status(200).json(newScore);
}
    
const deleteScore = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Remove a specific a score by its ID'
     */
    const { id } = req.params;
    await gamePlayerService.deleteGamePlayer(id);
    res.status(204).send();
}

const getScoresByGameId = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Get a the scores of the players in a specific game'
     */
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