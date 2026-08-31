const { Server } = require('socket.io');
const authMiddleware = require('./middlewares/auth.socket-middleware');
const registerGameHandler = require('./sockets/game-engine.socket');
const errorWrapper = require('./middlewares/error.socket-wrapper');
const createGameEngineSocketCallbacks = require('./callbacks/game-engine.callbacks');

const { gamePlayerService, gameService, gameEngineService, gameCardService } = require('../compositions');

const initializeSocket = (server) => {
    const io = new Server(server);

    io.use(authMiddleware);
    io.on('connection', (socket) => {
        const gameEngineSocketCallbacks = createGameEngineSocketCallbacks(io,socket, errorWrapper, gamePlayerService, gameService, gameEngineService, gameCardService);
        registerGameHandler(socket, gameEngineSocketCallbacks);
    });
}

module.exports = initializeSocket;