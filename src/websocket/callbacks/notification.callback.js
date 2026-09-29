const roomHandler = require('../handlers/room.handler');

const createNotificationCallbacks = (
    io,
    socket,
    wrapError,
    playerRegistry,
    playerService,
    gameService,
    gamePlayerService,
) => {
    const sendInvitation = () => wrapError(socket, async ({ playerId, gameId }) => {
        const senderId = socket.player.id;
        if (!playerRegistry.isOnline(playerId)) {
            const error = new Error('player not found');
            error.statusCode = 400;
            throw error;
        }

        const sender = await playerService.findPlayerById(senderId);
        const game = await gameService.findGameById(gameId);

        if (!sender.ok) {
            throw sender.error;
        }
        if (!game.ok) {
            throw game.error;
        }

        const connections = playerRegistry.getConnections(playerId);

        if (!connections) {
            const error = new Error('player not found');
            error.statusCode = 400;
            throw error;
        }
        connections.forEach(conn => {
            io.to(conn).emit('invitation-sent', {
                sender: sender.result,
                game: game.result,
            });
        });
    });

    const rejectInvitation = () => wrapError(socket, async ({ playerId }) => {
        const connections = playerRegistry.getConnections(playerId);
        if (!connections) {
            const error = new Error('player not found');
            error.statusCode = 400;
            throw error;
        }
        connections.forEach(conn => {
            io.to(conn).emit('invitation-rejected');
        });
    });

    const acceptInvitation = () => wrapError(socket, async ( { gameId } ) => {
        const playerId = socket.player.id;
        const result = await gamePlayerService.addGamePlayer({ playerId, gameId });
        if (!result.ok) {
            throw result.error;
        }

        roomHandler.joinRoom(socket, gameId);
        roomHandler.broadcast(io, gameId, 'player-joined', result.result);
    });

    return { sendInvitation, rejectInvitation, acceptInvitation };
}

module.exports = createNotificationCallbacks;