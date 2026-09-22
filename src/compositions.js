const gameRepository = require('./repositories/game.repository');
const playerRepository = require('./repositories/player.repository');
const gamePlayerRepository = require('./repositories/game-player.repository');
const cardRepository = require('./repositories/card.repository');
const gameCardRepository = require('./repositories/game-card.repository');
const historyRepository = require('./repositories/history.repository');
const apiRequestRepository = require('./repositories/api-request.repository');
const playerRegisty = require('./registry/player.registry');

const gameDto = require('./dto/game.dto');
const playerDto = require('./dto/player.dto');
const cardDto = require('./dto/card.dto');
const gameCardDto = require('./dto/game-card.dto');
const gamePlayerDto = require('./dto/game-player.dto');
const apiRequestDto = require('./dto/api-request.dto');
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
const createGameEngineService = require('./services/game-engine.service');
const createHistoryService = require('./services/history.service');
const createRequestStatsService = require('./services/request-stats.service');

const gameStartValidators = require('./services/validators/game-start.validator');
const gameFinishValidators = require('./services/validators/game-finish.validator');
const addGamePlayervalidators = require('./services/validators/add-game-player.validator');
const rulesCreateDeckValidators = require('./services/validators/rules-create-deck.validator');
const rulesPlayCardValidators = require('./services/validators/rules-play-card.validator');
const hasValidCardValidators = require('./services/validators/has-valid-card.validator');

const tokenService = createTokenService();
const gameService = createGameService(gameRepository, playerRepository, gamePlayerRepository, gameCardRepository, historyRepository, gameDto, cardDto, gamePlayerDto, gameCardDto, notFoundHelper, conflictHelper, resultHelper, gameStartValidators, gameFinishValidators);
const authService = createAuthService(tokenService, playerRepository, notFoundHelper, conflictHelper, resultHelper, playerDto);
const gamePlayerService = createGamePlayerService(gamePlayerRepository, gameRepository, playerRepository, gamePlayerDto, notFoundHelper, conflictHelper, resultHelper, addGamePlayervalidators);
const cardService = createCardService(cardRepository, cardDto, notFoundHelper, conflictHelper, resultHelper);
const gameCardService = createGameCardService(gameCardRepository, gameRepository, cardRepository, playerRepository, gamePlayerRepository, gameCardDto, cardDto, notFoundHelper, conflictHelper, resultHelper, rulesCreateDeckValidators);
const playerService = createPlayerService(playerRepository, playerRegisty, playerDto, notFoundHelper, conflictHelper, resultHelper);
const gameEngineService = createGameEngineService(gameRepository, gameCardRepository, gamePlayerRepository,playerRepository, cardRepository, historyRepository, cardDto, gameCardDto, gamePlayerDto, notFoundHelper, conflictHelper, resultHelper, rulesPlayCardValidators, hasValidCardValidators);
const historyService = createHistoryService(historyRepository, gameRepository, notFoundHelper, resultHelper);
const requestStatsService = createRequestStatsService(apiRequestRepository, apiRequestDto, resultHelper);

const createAuthController = require('./controllers/auth.controller');
const createCardController = require('./controllers/card.controller');
const createGameController = require('./controllers/game.controller');
const createPlayerController = require('./controllers/player.controller');
const createScoreController = require('./controllers/score.controller');
const createGamePlayerController = require('./controllers/game-player.controller');
const createGameCardController = require('./controllers/game-card.controller');
const createGameEngineController = require('./controllers/game-engine.controller');
const createHistoryController = require('./controllers/history.controller');
const createRequestStatsController = require('./controllers/request-stats.controller');

const authController = createAuthController(authService);
const cardController = createCardController(cardService);
const gameController = createGameController(gameService);
const playerController = createPlayerController(playerService);
const scoreController = createScoreController(gamePlayerService);
const gamePlayerController = createGamePlayerController(gamePlayerService);
const gameCardController = createGameCardController(gameCardService);
const gameEngineController = createGameEngineController(gameEngineService);
const historyController = createHistoryController(historyService);
const requestStatsController = createRequestStatsController(requestStatsService);

module.exports = {
    tokenService,
    gameService,
    authService,
    gamePlayerService,
    cardService,
    gameCardService,
    playerService,
    gameEngineService,
    requestStatsService,
    authController,
    cardController,
    gameController,
    playerController,
    scoreController,
    gamePlayerController,
    gameCardController,
    gameEngineController,
    historyController,
    requestStatsController,
}