const roomHandler = require('../../../src/websocket/handlers/room.handler');

const createSocket = (rooms = new Set()) => ({
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(),
    rooms,
});

const createIo = () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
});

describe('tests for room handler', () => {
    describe('joinRoom', () => {
        test('call socket.join with the given gameId', () => {
            const socket = createSocket();
            roomHandler.joinRoom(socket, 'game-1');
            expect(socket.join).toHaveBeenCalledWith('game-1');
        });
    });

    describe('leaveRoom', () => {
        test('call socket.leave with the given gameId', () => {
            const socket = createSocket();
            roomHandler.leaveRoom(socket, 'game-1');
            expect(socket.leave).toHaveBeenCalledWith('game-1');
        });
    });

    describe('broadcast', () => {
        test('emit the event with data to the given room using io', () => {
            const io = createIo();
            io.to.mockReturnValue(io);

            roomHandler.broadcast(io, 'game-1', 'player-joined', { playerId: 'p1' });

            expect(io.to).toHaveBeenCalledWith('game-1');
            expect(io.emit).toHaveBeenCalledWith('player-joined', { playerId: 'p1' });
        });

        test('emit the event using a socket instance (excludes sender)', () => {
            const socket = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            };

            roomHandler.broadcast(socket, 'game-1', 'player-left', { playerId: 'p1' });

            expect(socket.to).toHaveBeenCalledWith('game-1');
            expect(socket.emit).toHaveBeenCalledWith('player-left', { playerId: 'p1' });
        });
    });
});
