const playerRegisry = require('../../registry/player.registry');

const createPlayerStatusCallbacks = (
    io,
    socket,
    wrapError,
    playerService,
) => {
    const updateCurrentPlayers = (status) => wrapError(socket, async () => {
        const playerId = socket.player.id;
        const socketId = socket.id;

        const realStatusChanged = status === 'ONLINE'
        ? playerRegisry.addConnection(playerId, socketId)
        : playerRegisry.removeConnection(playerId, socketId);

        if (!realStatusChanged) return;

        const result = await playerService.updatePlayerStatus(playerId, status);
        if (!result.ok) throw result.error;

        io.emit('updated-current-players', { currentPlayers: playerRegisry.getOnlineCount() });
    });

    return { updateCurrentPlayers }
}

module.exports = createPlayerStatusCallbacks;
