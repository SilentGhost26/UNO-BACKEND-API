/**
 * Factory to create the player service
 * @param playerRepository : dependency of player repository
 * @param playerDto : dependency of player repository
 * @param notFoundHelper : dependency of player repository
 * @param conflictHelper : dependency of player repository
 * @returns a literal object that contains the functios of player service
 */
const createPlayerService = (
    playerRepository,
    playerRegistry,
    playerDto,
    notFoundHelper,
    conflictHelper,
    { ok, err }
) => {

    /**
     * find a specific player by its id
     * @param id : id of the player
     * @returns the found player
    */
   const findPlayerById = async (id) => {
       const player = await playerRepository.getById(id);
       if(!player) {
           return notFoundHelper.throwError404(id, 'player');
        }
        
        return ok(playerDto.toResponseDto(player));
    }
    
    /**
     * update a specific player by its id
     * @param id : id of the player
     * @param gameData : data of the player that will be udpated
     * @returns the updated player
    */
   const updatePlayer = async (id, playerData) => {
       const player = playerDto.fromUpdateDto(playerData);
       const updatedPlayer = await playerRepository.update(id, player);
       if (!updatedPlayer) {
           return notFoundHelper.throwError404(id, 'player');
        }
        
        return ok(playerDto.toResponseDto(updatedPlayer));
    }
    
    /**
     * Delete a specific player by its id
     * @param id : id of the player
    */
   const deletePlayer = async (id) => {
       const deleted = await playerRepository.remove(id);
       if(!deleted) {
           return notFoundHelper.throwError404(id, 'player');
        }
        return ok();
    }
    
    /**
     * Get the date of log out of a specific player
     * @param id : id of the player
     * @returns the date of log out
    */
   const getLoggedOutDateByPlayerId = async (id) => {
       const date = await playerRepository.getLoggedOutDateById(id);
       
       if (!date) {
           return null;
        }
        return date;
    }

    const updatePlayerStatus = async (id, status) => {
        if (status !== 'ONLINE' && status !== 'OFFLINE')
        {
            return err(new Error(`nvalid status: ${status}`));
        }

        const updatedPlayer = await playerRepository.update(id, { status });
       if (!updatedPlayer) {
           return notFoundHelper.throwError404(id, 'player');
        }

        return ok();
    }

    const getTotalOnlinePlayers = () => {
        return ok(playerRegistry.getOnlineCount());
    }

    const getPlayersByPagination = async (page, limit) => {
        const numberPage = Number(page);
        const numberLimit = Number(limit);

        if (Number.isNaN(numberPage) || Number.isNaN(numberLimit)) {
            const error = new Error('The params must be numbers');
            error.statusCode = 400;
            return err(error);
        }

        if (numberPage <= 0 || numberLimit <= 0) {
            const error = new Error('The params must be positive values');
            error.statusCode = 400;
            return err(error);
        }

        const players = await playerRepository.getByPagination(numberPage, numberLimit);
        return ok(players.map(playerDto.toResponseDto));
    }
    
    return { findPlayerById, updatePlayer, deletePlayer, getLoggedOutDateByPlayerId, updatePlayerStatus, getTotalOnlinePlayers, getPlayersByPagination };
}

module.exports = createPlayerService;