/**
 * Factory to create the game player controller
 * @param gamePlayerService : dependency of game player service
 * @returns a literal object that contains the functions of game player controller
 */
const createGamePlayerController = (gamePlayerService) => {

    const addGamePlayer = async (req, res, next) => {
        /**
         * #swagger.tags = ['GamePlayers']
         * #swagger.description = 'Add a new player in a game'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { gameId } = req.params;
        const gamePlayerData = { gameId: gameId, playerId: req.player.id }
        const gamePlayer = await gamePlayerService.addGamePlayer(gamePlayerData);
        if (!gamePlayer.ok) {
            return next(gamePlayer.error);
        }
        res.status(201).json(gamePlayer.result);
    }

    const removeGamePlayer = async (req, res, next) => {
        /**
         * #swagger.tags = ['GamePlayers']
         * #swagger.description = 'Remove player from a game'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { gameId } = req.params;
        const playerId = req.player.id;
        const result = await gamePlayerService.deleteGamePlayer(gameId, playerId);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(204).json({
            message: "Player left the game succesfully"
        });
    }

    const getPlayersInGame = async (req, res, next) => {
        /**
         * #swagger.tags = ['GamePlayers']
         * #swagger.description = 'Get the players that are in a game'
         */

        const { gameId } = req.params;
        const players = await gamePlayerService.getPlayersByGameId(gameId);
        if (!players.ok) {
            return next(players.error);
        }
        res.status(200).json({
            gameId: gameId,
            players: players.result
        })
    }

    const getCurrentPlayerToPlay = async (req, res, next) => {
        /**
         * #swagger.tags = ['GamePlayers']
         * #swagger.description = 'Get the current player in the turn to play'
         */
        const { gameId } = req.params;
        const player = await gamePlayerService.getCurrentPlayerToPlay(gameId);
        if (!player.ok) {
            return next(player.error);
        }
        res.status(200).json({
            gameId: gameId,
            player: player.result,
        });
    }

    return {
        addGamePlayer,
        removeGamePlayer,
        getPlayersInGame,
        getCurrentPlayerToPlay
    }
}

module.exports = createGamePlayerController;