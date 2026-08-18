const gamePlayerService = require('../services/game-player.service');

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
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
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


const getScoresByGameId = async (req, res) => {
    /**
     * #swagger.tags = ['Scores']
     * #swagger.description = 'Get a the scores of the players in a specific game'
     */
    const { gameId } = req.params;
    const scores = await gamePlayerService.findScoresBygameId(gameId);
    res.status(200).json({
        gameId: gameId,
        scores: scores});
}

module.exports = {
    updateScore,
    getScoreById,
    getScoresByGameId
}