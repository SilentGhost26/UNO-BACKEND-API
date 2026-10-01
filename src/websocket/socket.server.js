const { Server } = require('socket.io');
const playerRegisry = require('../registry/player.registry');
const authMiddleware = require('./middlewares/auth.socket-middleware');
const registerGameHandler = require('./sockets/game-engine.socket');
const registerPlayerStatusHandler = require('./sockets/player-status.socket');
const registerNotificationSocket = require('./sockets/notification.socket');
const roomHandler = require('./handlers/room.handler');
const publisher = require('./publish');

const errorWrapper = require('./middlewares/error.socket-wrapper');

const createGameEngineSocketCallbacks = require('./callbacks/game-engine.callbacks');
const createPlayerStatusCallbacks = require('./callbacks/player-status.callback');
const createNotificationCallbacks = require('./callbacks/notification.callback');

const { gamePlayerService, gameService, gameEngineService, gameCardService, playerService, invitationRegistry } = require('../compositions');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONT_END_URL || 'http://localhost:3001',
        }
    });
    publisher.setServer(io);
    io.use(authMiddleware);
    io.on('connection', (socket) => {
        socket.join('lobby');
        roomHandler.joinRoom(socket, roomHandler.playerRoom(socket.player.id));

        socket.on('watch-game', async ({ gameId } = {}, acknowledge) => {
            try {
                if (typeof gameId !== 'string' || !gameId) throw new Error('Invalid game ID');
                const players = await gamePlayerService.getPlayersByGameId(gameId);
                if (!players.ok || !players.result.some(p => p.playerId === socket.player.id)) {
                    throw new Error('Player is not part of this game');
                }
                socket.join(gameId);
                acknowledge?.({ ok: true });
            } catch (error) {
                acknowledge?.({ ok: false, message: error.message });
            }
        });
        socket.on('unwatch-game', ({ gameId } = {}) => {
            if (typeof gameId === 'string') socket.leave(gameId);
        });

        const gameEngineSocketCallbacks = createGameEngineSocketCallbacks(io,socket, errorWrapper, gamePlayerService, gameService, gameEngineService, gameCardService);
        registerGameHandler(socket, gameEngineSocketCallbacks);

        const playerStatusCallbacks = createPlayerStatusCallbacks(io, socket, errorWrapper, playerService, playerRegisry);
        registerPlayerStatusHandler(socket, playerStatusCallbacks);

        const notificationCallbacks = createNotificationCallbacks(io, socket, errorWrapper, playerRegisry, playerService, gameService, gamePlayerService, invitationRegistry);
        registerNotificationSocket(socket, notificationCallbacks);
    });
}

module.exports = initializeSocket;
