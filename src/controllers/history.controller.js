const createHistoryController = (
    historyService,
) => {
    const getGameHistory = async (req, res, next) => {
        const { gameId } = req.params;

        const history = await historyService.getGameHistory(gameId);
        if (!history.ok) {
            return next(history.error);
        }

        res.status(200).json({
            gameId: gameId,
            history: history.result,
        });
    }

    return { getGameHistory };
}

module.exports = createHistoryController;