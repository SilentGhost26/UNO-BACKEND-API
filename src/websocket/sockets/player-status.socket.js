const registerPlayerStatusHandler = (
    socket,
    playerStatusCallbacks,
) => {
    socket.on('join-player', playerStatusCallbacks.updateCurrentPlayers('ONLINE'));
    socket.on('disconnect', playerStatusCallbacks.updateCurrentPlayers('OFFLINE'));
}

module.exports = registerPlayerStatusHandler;