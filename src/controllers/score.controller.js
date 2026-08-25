/**
 * Factory to create the score controller
 * @param gamePlayerService : dependency of game player service
 * @returns a literal object that contains the functions of score controller
 */
const createScoreController = (gamePlayerService) => {

    const getScoreById = async (req, res, next) => {
        /**
         * #swagger.tags = ['Scores']
         * #swagger.description = 'Get a specific a score by its ID'
         */
        const { id } = req.params;
        const score = await gamePlayerService.findScoreById(id);
        if (!score.ok) {
            return next(score.error);
        }
        res.status(200).json(score.result);
    }

    const updateScore = async (req, res, next) => {
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
        const updatedScore = await gamePlayerService.updateScore(id, score);
        if (!updatedScore.ok) {
            return next(updatedScore.error);
        }
        res.status(200).json(updatedScore.result);
    }

    const getScoresByGameId = async (req, res, next) => {
        /**
         * #swagger.tags = ['Scores']
         * #swagger.description = 'Get a the scores of the players in a specific game'
         */
        const { gameId } = req.params;
        const scores = await gamePlayerService.findScoresBygameId(gameId);
        if (!scores.ok) {
            return next(scores.error);
        }
        res.status(200).json({
            gameId: gameId,
            scores: scores.result});
    }

    return {
        updateScore,
        getScoreById,
        getScoresByGameId
    }
}

module.exports = createScoreController;