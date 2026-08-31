const createHistoryService = (
    historyRepository,
    gameRepository,
    notFoundHelper,
    { ok },
) => {

    /**
     * Function to get the history of actions in a specific game
     * @param gameId : id of the game
     * @returns a list of history
     */
    const getGameHistory = async (gameId) => {
        const game = await gameRepository.getById(gameId);
        if(!game) {
           return notFoundHelper.throwError404(gameId, 'game');
        }
        const history = await historyRepository.getByGameId(gameId);
        return ok(history.map(h => { 
            return {
                    action: h.action,
                    player: h.Player.name,
                };
        }));
    }

    return { getGameHistory };
}

module.exports = createHistoryService;