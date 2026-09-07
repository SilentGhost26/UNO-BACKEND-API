const registerGameHandler = require('../../../src/websocket/sockets/game-engine.socket');

const createSocket = () => ({ on: jest.fn() });

const createCallbacks = () => ({
    createGame: jest.fn(),
    enterGame: jest.fn(),
    leaveGame: jest.fn(),
    startGame: jest.fn(),
    distributeCards: jest.fn(),
    playCard: jest.fn(),
    draw: jest.fn(),
    sayUno: jest.fn(),
    challenge: jest.fn(),
    leaveByError: jest.fn(),
    updateGame: jest.fn(),
});

describe('tests for game engine socket wiring', () => {
    test('registers every game event with its corresponding callback', () => {
        const socket = createSocket();
        const callbacks = createCallbacks();

        registerGameHandler(socket, callbacks);

        expect(socket.on).toHaveBeenCalledWith('enter-game', callbacks.enterGame());
        expect(socket.on).toHaveBeenCalledWith('leave-game', callbacks.leaveGame());
        expect(socket.on).toHaveBeenCalledWith('start-game', callbacks.startGame());
        expect(socket.on).toHaveBeenCalledWith('distribute-cards', callbacks.distributeCards());
        expect(socket.on).toHaveBeenCalledWith('play-card', callbacks.playCard());
        expect(socket.on).toHaveBeenCalledWith('draw', callbacks.draw());
        expect(socket.on).toHaveBeenCalledWith('say-uno', callbacks.sayUno());
        expect(socket.on).toHaveBeenCalledWith('challenge', callbacks.challenge());
        expect(socket.on).toHaveBeenCalledWith('disconnecting', callbacks.leaveByError());
    });
});
