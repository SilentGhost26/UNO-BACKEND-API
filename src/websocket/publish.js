let io = null;

const setServer = (server) => { io = server; };
const lobbyUpdated = () => { io?.to('lobby').emit('lobby-updated'); };
const gameUpdated = (gameId) => { io?.to(String(gameId)).emit('game-updated', { gameId: String(gameId) }); };

module.exports = { setServer, lobbyUpdated, gameUpdated };
