const joinRoom = (socket, gameId) => {
    socket.join(gameId);
}

const leaveRoom = (socket, gameId) => {
    socket.leave(gameId);
}

const broadcast = (instance, gameId, event, data) => {
    instance.to(gameId).emit(event, data);
}

module.exports = {
    joinRoom,
    leaveRoom,
    broadcast,
}