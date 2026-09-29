const createPlayerStatusCallbacks = (
    io,
    socket,
    wrapError,
    playerService,
    playerRegistry,
) => {
    const updateCurrentPlayers = (status) => wrapError(socket, async () => {
        const playerId = socket.player.id;
        const socketId = socket.id;

        const realStatusChanged = status === 'ONLINE'
        ? playerRegistry.addConnection(playerId, socketId)
        : playerRegistry.removeConnection(playerId, socketId);

        if (!realStatusChanged) return;

        const result = await playerService.updatePlayerStatus(playerId, status);
        if (!result.ok) throw result.error;

        io.emit('updated-current-players', { currentPlayers: playerRegistry.getOnlineCount() });
    });

    return { updateCurrentPlayers }
}

module.exports = createPlayerStatusCallbacks;
