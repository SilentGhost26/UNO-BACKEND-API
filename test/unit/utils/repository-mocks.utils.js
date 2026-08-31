const gameRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    getByIdWithRules: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
}

const cardRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    removeAll: jest.fn(),
}

const playerRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getByEmail: jest.fn(),
    getLoggedOutDateById: jest.fn()
}

const gamePlayerRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getByGameId: jest.fn(),
    getTotalPlayersInGame: jest.fn(),
    getByGameIdPlayerId: jest.fn(),
    getCurrentPlayerToPlay: jest.fn(),
}

const gameCardRepository = {
    create: jest.fn(),
    getByIds: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    getByGameId: jest.fn(),
    getTopCardFromDiscard: jest.fn(),
    getTopCardFromDeck: jest.fn(),
    getPlayerHand: jest.fn(),
    getCuantityCardsInHand: jest.fn(),
}

const historyRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    getByGameId: jest.fn(),
}

module.exports = {
    gameRepository,
    cardRepository,
    playerRepository,
    gamePlayerRepository,
    gameCardRepository,
    historyRepository,
}