const authService = {
    registerPlayer: jest.fn(),
    authenticatePlayer: jest.fn(),
    logoutPlayer: jest.fn(),
};

const cardService = {
    initializeCards: jest.fn(), 
    getAllCards: jest.fn(), 
    findCardById: jest.fn(), 
    createCard: jest.fn(), 
    updateCard: jest.fn(), 
    deleteCard: jest.fn(),
};

const gameCardService = {
    createDeck: jest.fn(), 
    getByGameId: jest.fn(), 
    updateGameCard: jest.fn(), 
    getTopCardFromDeck: jest.fn(),
};

const gamePlayerService = {
    addGamePlayer: jest.fn(), 
    findScoresBygameId: jest.fn(), 
    updateScore: jest.fn(), 
    deleteGamePlayer: jest.fn(), 
    findScoreById: jest.fn(), 
    getPlayersByGameId: jest.fn(), 
    getCurrentPlayerToPlay: jest.fn(),
};

const gameService = {
    addGame: jest.fn(), 
    findGameById: jest.fn(), 
    updateGame: jest.fn(), 
    deleteGame: jest.fn(), 
    startGame: jest.fn(), 
    finishGame: jest.fn(),
};

const playerService = {
    findPlayerById: jest.fn(), 
    updatePlayer: jest.fn(), 
    deletePlayer: jest.fn(), 
    getLoggedOutDateByPlayerId: jest.fn(),
};

const tokenService = {
    createUserToken: jest.fn(), 
    decodeValidToken: jest.fn(),
};

module.exports = {
    authService,
    cardService,
    gameCardService,
    gamePlayerService,
    gameService,
    playerService,
    tokenService
}