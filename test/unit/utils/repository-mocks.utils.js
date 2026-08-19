const gameRepository = {
    create: jest.fn(),
    getById: jest.fn(),
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
    getTopCardFromDeck: jest.fn(),
}

module.exports = {
    gameRepository,
    cardRepository,
    playerRepository,
    gamePlayerRepository,
    gameCardRepository
}