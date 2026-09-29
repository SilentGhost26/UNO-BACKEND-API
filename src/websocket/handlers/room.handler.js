const PLAYER_ROOM_PREFIX = 'player:';

const joinRoom = (socket, gameId) => {
    socket.join(gameId);
}

const leaveRoom = (socket, gameId) => {
    socket.leave(gameId);
}

const broadcast = (instance, gameId, event, data) => {
    instance.to(gameId).emit(event, data);
}

/**
 * Name of the personal room of a player. Every socket of the player (every tab) joins it
 * when connecting, so broadcasting to this room reaches all of them.
 */
const playerRoom = (playerId) => `${PLAYER_ROOM_PREFIX}${playerId}`;

const isPlayerRoom = (room) => typeof room === 'string' && room.startsWith(PLAYER_ROOM_PREFIX);

module.exports = {
    joinRoom,
    leaveRoom,
    broadcast,
    playerRoom,
    isPlayerRoom,
}
