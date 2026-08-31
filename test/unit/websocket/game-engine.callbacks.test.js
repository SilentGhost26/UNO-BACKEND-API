const createGameEngineSocketCallbacks = require('../../../src/websocket/callbacks/game-engine.callbacks');
const { gamePlayerService, gameService, gameEngineService, gameCardService } = require('../utils/services-mocks.utils');

const createSocket = (rooms = new Set()) => ({
    player: { id: 'player-1' },
    rooms,
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
});

const createIo = () => {
    const io = { to: jest.fn(), emit: jest.fn() };
    io.to.mockReturnValue(io);
    return io;
};

const wrapError = (socket, handler) => async (data) => {
    try {
        await handler(data);
    } catch (error) {
        socket.emit('error', {
            message: error.message || 'internal server error',
            statusCode: error.statusCode || 500,
        });
    }
};
const passingSchema = { validate: jest.fn() };

let socket;
let io;
let callbacks;

describe('tests for game engine socket callbacks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        socket = createSocket();
        passingSchema.validate.mockReset();
        passingSchema.validate.mockReturnValue({ error: null, value: {} });
        io = createIo();
        callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
    });

    describe('enterGame', () => {
        test('join the room and broadcast player-joined on success', async () => {
            gamePlayerService.addGamePlayer.mockResolvedValue({ ok: true, result: { playerId: 'player-1' } });

            await callbacks.enterGame()({ gameId: 'game-1' });

            expect(gamePlayerService.addGamePlayer).toHaveBeenCalledWith({ playerId: 'player-1', gameId: 'game-1' });
            expect(socket.join).toHaveBeenCalledWith('game-1');
            expect(io.to).toHaveBeenCalledWith('game-1');
            expect(io.emit).toHaveBeenCalledWith('player-joined', { playerId: 'player-1' });
        });

        test('emit an error when addGamePlayer fails', async () => {
            const error = new Error('game not found');
            error.statusCode = 404;
            gamePlayerService.addGamePlayer.mockResolvedValue({ ok: false, error });

            await callbacks.enterGame()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'game not found', statusCode: 404 });
            expect(socket.join).not.toHaveBeenCalled();
        });
    });

    describe('leaveGame', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.leaveGame()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gamePlayerService.deleteGamePlayer).not.toHaveBeenCalled();
        });

        test('leave the room and broadcast player-left on success', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            gamePlayerService.deleteGamePlayer.mockResolvedValue({ ok: true, result: { playerId: 'player-1' } });

            await callbacks.leaveGame()({ gameId: 'game-1' });

            expect(gamePlayerService.deleteGamePlayer).toHaveBeenCalledWith('game-1', 'player-1');
            expect(socket.leave).toHaveBeenCalledWith('game-1');
            expect(socket.to).toHaveBeenCalledWith('game-1');
            expect(socket.emit).toHaveBeenCalledWith('player-left', { playerId: 'player-1' });
        });

        test('emit an error when deleteGamePlayer fails', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const error = new Error('player not found');
            error.statusCode = 404;
            gamePlayerService.deleteGamePlayer.mockResolvedValue({ ok: false, error });

            await callbacks.leaveGame()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'player not found', statusCode: 404 });
        });
    });

    describe('startGame', () => {
        test('start the game, initialize the deck and broadcast game-started on success', async () => {
            gameService.startGame.mockResolvedValue({ ok: true, result: {} });
            gameCardService.createDeck.mockResolvedValue({ ok: true });

            await callbacks.startGame()({ gameId: 'game-1' });

            expect(gameService.startGame).toHaveBeenCalledWith('game-1', 'player-1');
            expect(socket.join).toHaveBeenCalledWith('game-1');
            expect(gameCardService.createDeck).toHaveBeenCalledWith('game-1');
            expect(io.to).toHaveBeenCalledWith('game-1');
            expect(io.emit).toHaveBeenCalledWith('game-started', null);
        });

        test('emit an error and skip deck creation when startGame fails', async () => {
            const error = new Error('game already started');
            error.statusCode = 409;
            gameService.startGame.mockResolvedValue({ ok: false, error });

            await callbacks.startGame()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'game already started', statusCode: 409 });
            expect(gameCardService.createDeck).not.toHaveBeenCalled();
        });

        test('emit an error when createDeck fails', async () => {
            gameService.startGame.mockResolvedValue({ ok: true, result: {} });
            const error = new Error('deck already exists');
            error.statusCode = 409;
            gameCardService.createDeck.mockResolvedValue({ ok: false, error });

            await callbacks.startGame()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'deck already exists', statusCode: 409 });
            expect(io.emit).not.toHaveBeenCalledWith('game-started', null);
        });
    });

    describe('distributeCards', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.distributeCards(passingSchema)({ gameId: 'game-1', cardsPerPlayer: 7 });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gameEngineService.distributeCards).not.toHaveBeenCalled();
        });

        test('broadcast distributed-cards on success', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            passingSchema.validate.mockReturnValue({ error: null, value: { gameId: 'game-1', cardsPerPlayer: 7 } });
            gameEngineService.distributeCards.mockResolvedValue({ ok: true, result: { cards: [] } });

            await callbacks.distributeCards(passingSchema)({ gameId: 'game-1', cardsPerPlayer: 7 });

            expect(gameEngineService.distributeCards).toHaveBeenCalledWith('game-1', 7);
            expect(io.emit).toHaveBeenCalledWith('distributed-cards', { cards: [] });
        });

        test('emit an error when distributeCards fails', async () => {
            socket = createSocket(new Set(['game-1']));
            passingSchema.validate.mockReturnValue({ error: null, value: { gameId: 'game-1', cardsPerPlayer: 7 } });
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const error = new Error('cards already distributed');
            error.statusCode = 409;
            gameEngineService.distributeCards.mockResolvedValue({ ok: false, error });

            await callbacks.distributeCards(passingSchema)({ gameId: 'game-1', cardsPerPlayer: 7 });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'cards already distributed', statusCode: 409 });
        });
    });

    describe('playCard', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.playCard(passingSchema)({ gameId: 'game-1', cardId: 'card-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gameEngineService.playCard).not.toHaveBeenCalled();
        });

        test('broadcast card-played on success', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            passingSchema.validate.mockReturnValue({ error: null, value: { gameId: 'game-1', cardId: 'card-1', newColor: 'RED' } });
            gameEngineService.playCard.mockResolvedValue({ ok: true, result: { cardId: 'card-1' } });
            await callbacks.playCard(passingSchema)({ gameId: 'game-1', cardId: 'card-1', newColor: 'RED' });

            expect(gameEngineService.playCard).toHaveBeenCalledWith('player-1', 'game-1', 'card-1', 'RED');
            expect(io.emit).toHaveBeenCalledWith('card-played', { cardId: 'card-1' });
        });

        test('emit an error when playCard fails', async () => {
            socket = createSocket(new Set(['game-1']));
            passingSchema.validate.mockResolvedValue({error: { message: 'invalid card', statusCode: 422 }});
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            passingSchema.validate.mockReturnValue({ error: null, value: { gameId: 'game-1', cardId: 'card-1' } });
            const error = new Error('invalid card');
            error.statusCode = 422;
            gameEngineService.playCard.mockResolvedValue({ ok: false, error });

            await callbacks.playCard(passingSchema)({ gameId: 'game-1', cardId: 'card-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'invalid card', statusCode: 422 });
        });
    });

    describe('draw', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.draw()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gameEngineService.drawCard).not.toHaveBeenCalled();
        });

        test('emit the drawn cards to the player and broadcast a summary to the room', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const drawResult = { action: 'card drawn and pass turn', drawnCards: [{ id: 'card-2' }], nextPlayer: { playerId: 'player-2' } };
            gameEngineService.drawCard.mockResolvedValue({ ok: true, result: drawResult });

            await callbacks.draw()({ gameId: 'game-1' });

            expect(gameEngineService.drawCard).toHaveBeenCalledWith('game-1', 'player-1');
            expect(socket.emit).toHaveBeenCalledWith('cards-drawn', drawResult);
            expect(socket.to).toHaveBeenCalledWith('game-1');
            expect(socket.emit).toHaveBeenCalledWith('cards-drawn', { action: drawResult.action, nextPlayer: drawResult.nextPlayer });
        });

        test('emit an error when drawCard fails', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const error = new Error('no cards left');
            error.statusCode = 422;
            gameEngineService.drawCard.mockResolvedValue({ ok: false, error });

            await callbacks.draw()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'no cards left', statusCode: 422 });
        });
    });

    describe('sayUno', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.sayUno()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gameEngineService.sayUno).not.toHaveBeenCalled();
        });

        test('broadcast said-uno on success', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            gameEngineService.sayUno.mockResolvedValue({ ok: true, result: { playerId: 'player-1' } });

            await callbacks.sayUno()({ gameId: 'game-1' });

            expect(gameEngineService.sayUno).toHaveBeenCalledWith('game-1', 'player-1');
            expect(io.emit).toHaveBeenCalledWith('said-uno', { playerId: 'player-1' });
        });

        test('emit an error when sayUno fails', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const error = new Error('player already said uno');
            error.statusCode = 409;
            gameEngineService.sayUno.mockResolvedValue({ ok: false, error });

            await callbacks.sayUno()({ gameId: 'game-1' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'player already said uno', statusCode: 409 });
        });
    });

    describe('challenge', () => {
        test('emit 403 when the player is not in the room', async () => {
            await callbacks.challenge(passingSchema)({ gameId: 'game-1', challengedPlayerId: 'player-2' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'not joined to this game', statusCode: 403 });
            expect(gameEngineService.challengePlayer).not.toHaveBeenCalled();
        });

        test('broadcast player-challenged on success', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            passingSchema.validate.mockReturnValue({ error: null, value: { gameId: 'game-1', challengedPlayerId: 'player-2' } });
            gameEngineService.challengePlayer.mockResolvedValue({ ok: true, result: { challenged: 'player-2' } });

            await callbacks.challenge(passingSchema)({ gameId: 'game-1', challengedPlayerId: 'player-2' });

            expect(gameEngineService.challengePlayer).toHaveBeenCalledWith('game-1', 'player-2', 'player-1');
            expect(io.emit).toHaveBeenCalledWith('player-challenged', { challenged: 'player-2' });
        });

        test('emit an error when challengePlayer fails', async () => {
            socket = createSocket(new Set(['game-1']));
            callbacks = createGameEngineSocketCallbacks(io, socket, wrapError, gamePlayerService, gameService, gameEngineService, gameCardService);
            const error = new Error('challenge not valid');
            error.statusCode = 422;
            gameEngineService.challengePlayer.mockResolvedValue({ ok: false, error });

            await callbacks.challenge(passingSchema)({ gameId: 'game-1', challengedPlayerId: 'player-2' });

            expect(socket.emit).toHaveBeenCalledWith('error', { message: 'challenge not valid', statusCode: 422 });
        });
    });
});