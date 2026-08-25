const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Factory to create the auth service
 * @param tokenService : dependency of token service 
 * @param playerRepository : dependency of player repository
 * @param notFoundHelper : dependency of not found helper
 * @param conflictHelper : dependency of conflict helper
 * @param playerDto : dependency of player dto
 * @returns 
 */
const createAuthService = (
    tokenService,
    playerRepository,
    notFoundHelper,
    conflictHelper,
    { ok, err },
    playerDto
) => {
    /**
     * Register a new player
     * @param playerData : data of the player that will be registered 
     * @returns the registered player
    */
   const registerPlayer = async (playerData) => {
       const player = playerDto.fromCreateDto(playerData);
       const playerPassword = player.password;
       let hash;
       try {
           hash = await bcrypt.hash(playerPassword, saltRounds);
        } catch (error) {
            return err(new Error('Error encripting the password'));
        }
        
        player.password = hash;
        
        const existingPlayer = await playerRepository.getByEmail(player.email)
        if (existingPlayer) {
            return conflictHelper.throwError409('The email is already registered');
        }
        
        const newPlayer = await playerRepository.create(player);
        return ok(playerDto.toResponseDto(newPlayer));
    }
    /**
     * Verify if the email and password of a player matches with the database
     * @param email : The email of the player
     * @param password : The password of the player
     * @returns A valid jwt token
    */
   const authenticatePlayer = async (email, password) => {
       const player = await playerRepository.getByEmail(email);
       if (!player) {
           const error = new Error('player not registered');
           error.statusCode = 401;
           return err(error);
        }
        
        let result;
        try {
            result = await bcrypt.compare(password, player.password);
        } catch (error) {
            return err(new Error('Error comparing the password'));
        }
        
        if (result) {
            return ok(tokenService.createUserToken(player));
        } else {
            const error = new Error('incorrect email or password');
            error.statusCode = 401;
            return err(error);
        }
    }
    
    /**
     * Close the session of a player updating its logged out date
     * @param playerId : id of the player
    */
   const logoutPlayer = async (playerId) => {
       const player = await playerRepository.getById(playerId);
       if (!player) {
           return notFoundHelper.throwError404(playerId, 'player');
        }
        
        await playerRepository.update(playerId, { loggedOutAt: Date.now() });
        return ok();
    }

    return { registerPlayer, authenticatePlayer, logoutPlayer }
}

module.exports = createAuthService;