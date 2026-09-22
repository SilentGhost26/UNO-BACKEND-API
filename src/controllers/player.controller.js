/**
 * Factory to create the player controller
 * @param playerService : dependency of player service
 * @returns a literal object that contains the functions of player controller
 */
const createPlayerController = (playerService) => {

    const getPlayerById = async (req, res, next) => {
        /**
         * #swagger.tags = ['Players']
         * #swagger.description = 'Get a specific a player by its ID'
         */
        const { id } = req.params;
        const player = await playerService.findPlayerById(id);
        if (!player.ok) {
            return next(player.error);
        }
        res.status(200).json(player.result);
    }

    const updatePlayer = async (req, res, next) => {
         /**
         * #swagger.tags = ['Players']
         * #swagger.description = 'Update a specific player'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         * #swagger.parameters['body'] = {
           in: 'body',
           description: 'Update a player',
           schema: { name: "string", age: 0 } 
          }
         */
        const { id } = req.player;
        const player = await playerService.updatePlayer(id, req.body);
        if (!player.ok) {
            return next(player.error);
        }
        res.status(200).json(player.result);
    }
        
    const deletePlayer = async (req, res, next) => {
        /**
         * #swagger.tags = ['Players']
         * #swagger.description = 'Remove a specific a player by its jwt token'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { id } = req.player;
      
        const result = await playerService.deletePlayer(id);
        if (!result.ok) {
            return next(result.error);
        }
        res.status(204).send();
    }

    const getProfile = async (req, res, next) => {
        /**
         * #swagger.tags = ['Players']
         * #swagger.description = 'Get a the profile of a player by its jwt token'
         * #swagger.security = [{
                "apiKeyAuth": []
            }] 
         */
        const { id } = req.player;
        const player = await playerService.findPlayerById(id);
        if (!player.ok) {
            return next(player.error);
        }
        res.status(200).json(player.result);
    }

    const getTotalOnlinePlayers = (req, res, next) => {
        const total = playerService.getTotalOnlinePlayers();
        if (!total.ok) {
            return next(total.error);
        }

        res.status(200).json({ total: total.result });
    }

    const getPlayersByPagination = async (req, res, next) => {
        const { page = 1, limit = 5 } = req.query;
        const players = await playerService.getPlayersByPagination(page, limit);

        if (!players.ok)
        {
            return next(players.error);
        }

        const response = { players: players };

        const baseUrl = req.originalUrl.split('?')[0];

        if (page > 1) {
            const prevPageUrl = `${baseUrl}?page=${page - 1}&limit=${limit}`;
            response.prevPageUrl = prevPageUrl;
        }

        const nextPageUrl = `${baseUrl}?page=${page + 1}&limit=${limit}`;
        response.nextPageUrl = nextPageUrl;

        res.status(200).json(response);
    }

    return {
        getPlayerById,
        updatePlayer,
        deletePlayer,
        getProfile,
        getTotalOnlinePlayers,
        getPlayersByPagination,
    }
}

module.exports = createPlayerController;