const onlinePlayers = new Map();

const addConnection = (playerId, socketId) => {
    if (!onlinePlayers.has(playerId)) {
        onlinePlayers.set(playerId, new Set());
    }
    onlinePlayers.get(playerId).add(socketId);
    return onlinePlayers.get(playerId).size === 1;
}

function removeConnection(playerId, socketId) {
    const sockets = onlinePlayers.get(playerId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
        onlinePlayers.delete(playerId);
        return true; 
    }
    return false;
}

function getOnlineCount() {
    return onlinePlayers.size;
}

function isOnline(playerId) {
    return onlinePlayers.has(playerId);
}

module.exports = { addConnection, removeConnection, getOnlineCount, isOnline };