const gamePlayerService = require('../services/game-player.service');

const addGamePlayer = async (req, res) => {
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
    res.status(201).json(gamePlayer);
}

const removeGamePlayer = async (req, res) => {
    /**
     * #swagger.tags = ['GamePlayers']
     * #swagger.description = 'Remove player from a game'
     * #swagger.security = [{
            "apiKeyAuth": []
        }] 
     */
    const { gameId } = req.params;
    const playerId = req.player.id;
    await gamePlayerService.deleteGamePlayer(gameId, playerId);
    res.status(204).json({
        message: "Player left the game succesfully"
    });
}

module.exports = {
    addGamePlayer,
    removeGamePlayer
}