const roomHandler = require('../handlers/room.handler');

const createGameEngineSocketCallbacks = (
    io,
    socket,
    wrapError,
    gamePlayerService, 
    gameService, 
    gameEngineService, 
    gameCardService,
) => {
    const createGame = (gameSchema) => wrapError(socket, async (gameData) => {
        validateSchema(gameSchema, gameData);
        const playerId = socket.player.id;
        const game = await gameService.addGame({...gameData, ownerId: playerId});
        if (!game.ok) {
            throw game.error;
        }
        roomHandler.joinRoom(socket, game.result.id);
        socket.emit('created-game', game.result);
    });

    const enterGame = () => wrapError(socket, async ({ gameId }) => {
        const playerId = socket.player.id;
        const result = await gamePlayerService.addGamePlayer({ playerId, gameId });
        if (!result.ok) {
            throw result.error;
        }

        roomHandler.joinRoom(socket, gameId);
        roomHandler.broadcast(io, gameId, 'player-joined', result.result);
    });

    const leaveGame = () => wrapError(socket, async ({ gameId }) => {
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }
        const result = await gamePlayerService.deleteGamePlayer(gameId, playerId);
        if (!result.ok) {
            throw result.error;
        }
        roomHandler.leaveRoom(socket, gameId);
        roomHandler.broadcast(socket, gameId, 'player-left', result.result);
    });

    const startGame = () => wrapError(socket, async ({ gameId }) => {
        const playerId = socket.player.id;
        const started = await gameService.startGame(gameId, playerId);
        if (!started.ok) {
            throw started.error;
        }
        roomHandler.joinRoom(socket, gameId);
        const deckInit = await gameCardService.createDeck(gameId);
        if (!deckInit.ok) {
            throw deckInit.error;
        }

        roomHandler.broadcast(io, gameId, 'game-started', null);
    });

    const distributeCards = (distributeCardsSchema) => wrapError(socket, async ({ gameId, cardsPerPlayer }) => {
        validateSchema(distributeCardsSchema, {gameId, cardsPerPlayer});
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }

        const result = await gameEngineService.distributeCards(gameId, cardsPerPlayer);

        if (!result.ok) {
            throw result.error;
        }

        roomHandler.broadcast(io, gameId, 'distributed-cards', result.result);
    });

    const playCard = (playCardSchema) => wrapError(socket, async ({ gameId, cardId, newColor }) => {
        validateSchema(playCardSchema, { gameId, cardId, newColor });
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }

        const played = await gameEngineService.playCard(playerId, gameId, cardId, newColor);
        if (!played.ok) {
            throw played.error;
        }

        roomHandler.broadcast(io, gameId, 'card-played', played.result);
    });

    const draw = () => wrapError(socket, async ({ gameId }) => {
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }

        const drawnCards = await gameEngineService.drawCard(gameId, playerId);
        if (!drawnCards.ok) {
            throw drawnCards.error;
        }
        socket.emit('cards-drawn', drawnCards.result);
        roomHandler.broadcast(socket, gameId, 'cards-drawn', { action: drawnCards.result.action, nextPlayer: drawnCards.result.nextPlayer });
    });

    const sayUno = () => wrapError(socket, async ({ gameId }) => {
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }

        const saidUno = await gameEngineService.sayUno(gameId, playerId);
        if(!saidUno.ok) {
            throw saidUno.error;
        }

        roomHandler.broadcast(io, gameId, 'said-uno', saidUno.result);
    });

    const challenge = (challengeSchema) => wrapError(socket, async ({ challengedPlayerId, gameId }) => {
        validateSchema(challengeSchema, { challengedPlayerId, gameId });
        const playerId = socket.player.id;
        if (!isInRoom(socket, gameId)) {
            return socket.emit('error', { message: 'not joined to this game', statusCode: 403 });
        }

        const challenged = await gameEngineService.challengePlayer(gameId, challengedPlayerId, playerId);
        if (!challenged.ok) {
            throw challenged.error;
        }

        roomHandler.broadcast(io, gameId, 'player-challenged', challenged.result);
    });

    const leaveByError = () => wrapError(socket, async (data) => {
        const playerId = socket.player.id;
        socket.rooms.forEach(async room => {
            const result = await gamePlayerService.deleteGamePlayer(room, playerId);
            if (!result.ok) {
                throw result.error;
            }
            roomHandler.leaveRoom(socket, room);
            roomHandler.broadcast(socket, room, 'player-left', result.result);
        });
    });

    function isInRoom(socket, room) {
        return socket.rooms.has(room);
    }

    function validateSchema(schema, body) {
        const { error, value } = schema.validate(body, { abortEarly: false });
        if (error) {
            const newError = new Error('Validation failed');
            newError.statusCode = 400;
            newError.details = error.details.map((e) => e.message);
            throw newError;
        }
    }

    return { createGame, enterGame, leaveGame, startGame, distributeCards, sayUno, challenge, playCard, draw, leaveByError };
}

module.exports = createGameEngineSocketCallbacks;