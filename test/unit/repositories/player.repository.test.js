jest.mock('../../../src/models/player.model');

const { create, getById, update, remove, getByEmail, getLoggedOutDateById } = require('../../../src/repositories/player.repository');
const Player = require('../../../src/models/player.model');

