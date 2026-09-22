const { Server } = require('socket.io');
const authMiddleware = require('./middlewares/auth.socket-middleware');
const registerGameHandler = require('./sockets/game-engine.socket');
const registerPlayerStatusHandler = require('./sockets/player-status.socket');
const errorWrapper = require('./middlewares/error.socket-wrapper');
const createGameEngineSocketCallbacks = require('./callbacks/game-engine.callbacks');
const createPlayerStatusCallbacks = require('./callbacks/player-status.callback');

const { gamePlayerService, gameService, gameEngineService, gameCardService, playerService } = require('../compositions');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONT_END_URL,
        }
    });
    io.use(authMiddleware);
    io.on('connection', (socket) => {
        const gameEngineSocketCallbacks = createGameEngineSocketCallbacks(io,socket, errorWrapper, gamePlayerService, gameService, gameEngineService, gameCardService);
        registerGameHandler(socket, gameEngineSocketCallbacks);

        const playerStatusCallbacks = createPlayerStatusCallbacks(io, socket, errorWrapper, playerService);
        registerPlayerStatusHandler(socket, playerStatusCallbacks);
    });
}

module.exports = initializeSocket;