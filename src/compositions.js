const gameRepository = require('./repositories/game.repository');
const playerRepository = require('./repositories/player.repository');
const gamePlayerRepository = require('./repositories/game-player.repository');
const cardRepository = require('./repositories/card.repository');
const gameCardRepository = require('./repositories/game-card.repository');

const gameDto = require('./dto/game.dto');
const playerDto = require('./dto/player.dto');
const cardDto = require('./dto/card.dto');
const gameCardDto = require('./dto/game-card.dto');
const gamePlayerDto = require('./dto/game-player.dto');
const notFoundHelper = require('./helpers/not-found.helper');
const conflictHelper = require('./helpers/conflict.helper');
const resultHelper = require('./helpers/result.helper');

const createGameService = require('./services/game.service');
const createTokenService = require('./services/token.service');
const createAuthService = require('./services/auth.service');
const createGamePlayerService = require('./services/game-player.service');
const createCardService = require('./services/card.service');
const createGameCardService = require('./services/game-card.service');
const createPlayerService = require('./services/player.service');

const gameStartValidators = require('./services/validators/game-start.validator');
const gameFinishValidators = require('./services/validators/game-finish.validator');
const addGamePlayervalidators = require('./services/validators/add-game-player.validator');

const tokenService = createTokenService();
const gameService = createGameService(gameRepository, playerRepository, gamePlayerRepository, gameDto, notFoundHelper, conflictHelper, resultHelper, gameStartValidators, gameFinishValidators);
const authService = createAuthService(tokenService, playerRepository, notFoundHelper, conflictHelper, resultHelper, playerDto);
const gamePlayerService = createGamePlayerService(gamePlayerRepository, gameRepository, playerRepository, gamePlayerDto, notFoundHelper, conflictHelper, resultHelper, addGamePlayervalidators);
const cardService = createCardService(cardRepository, cardDto, notFoundHelper, conflictHelper, resultHelper);
const gameCardService = createGameCardService(gameCardRepository, gameRepository, cardRepository, playerRepository, gamePlayerRepository, gameCardDto, cardDto, notFoundHelper, conflictHelper, resultHelper);
const playerService = createPlayerService(playerRepository, playerDto, notFoundHelper, conflictHelper, resultHelper);

const createAuthController = require('./controllers/auth.controller');
const createCardController = require('./controllers/card.controller');
const createGameController = require('./controllers/game.controller');
const createPlayerController = require('./controllers/player.controller');
const createScoreController = require('./controllers/score.controller');
const createGamePlayerController = require('./controllers/game-player.controller');
const createGameCardController = require('./controllers/game-card.controller');

const authController = createAuthController(authService);
const cardController = createCardController(cardService);
const gameController = createGameController(gameService);
const playerController = createPlayerController(playerService);
const scoreController = createScoreController(gamePlayerService);
const gamePlayerController = createGamePlayerController(gamePlayerService);
const gameCardController = createGameCardController(gameCardService);

module.exports = {
    tokenService,
    gameService,
    authService,
    gamePlayerService,
    cardService,
    gameCardService,
    playerService,
    authController,
    cardController,
    gameController,
    playerController,
    scoreController,
    gamePlayerController,
    gameCardController
}