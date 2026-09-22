const gameSchema = require('../../schemas/game.schema');
const distributeCardsSchema = require('../../schemas/distribute-cards.schema');
const playCardSchema = require('../../schemas/play-card.schema');
const challengeSchema = require('../../schemas/challenge.schema');

const registerGameHandler = (
    socket,
    gameEngineCallbacks,
) => {
    socket.on('create-game', gameEngineCallbacks.createGame(gameSchema));
    socket.on('enter-game', gameEngineCallbacks.enterGame());
    socket.on('leave-game', gameEngineCallbacks.leaveGame());
    socket.on('start-game', gameEngineCallbacks.startGame());
    socket.on('distribute-cards', gameEngineCallbacks.distributeCards(distributeCardsSchema));
    socket.on('play-card', gameEngineCallbacks.playCard(playCardSchema));
    socket.on('draw', gameEngineCallbacks.draw());
    socket.on('say-uno', gameEngineCallbacks.sayUno());
    socket.on('challenge', gameEngineCallbacks.challenge(challengeSchema));
    socket.on('disconnecting', gameEngineCallbacks.leaveByError());
    socket.on('update-game', gameEngineCallbacks.updateGame(gameSchema));
}

module.exports = registerGameHandler;