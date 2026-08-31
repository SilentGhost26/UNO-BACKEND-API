jest.mock('../../../config/winston-logger.config', () => ({ error: jest.fn() }));
const logger = require('../../../config/winston-logger.config');
const errorWrapper = require('../../../src/websocket/middlewares/error.socket-wrapper');

const createSocket = () => ({
    emit: jest.fn(),
});

describe('tests for error socket wrapper', () => {
    test('call the handler with the received data', async () => {
        const socket = createSocket();
        const handler = jest.fn().mockResolvedValue(undefined);
        const wrapped = errorWrapper(socket, handler);

        await wrapped({ gameId: 'game-1' });

        expect(handler).toHaveBeenCalledWith({ gameId: 'game-1' });
    });

    test('emit an error event when the handler throws', async () => {
        const socket = createSocket();
        const error = new Error('something went wrong');
        error.statusCode = 400;
        const handler = jest.fn().mockRejectedValue(error);
        const wrapped = errorWrapper(socket, handler);

        await wrapped({ gameId: 'game-1' });

        expect(socket.emit).toHaveBeenCalledWith('error', {
            message: 'something went wrong',
            statusCode: 400,
            details: [],
        });
    });

    test('emit statusCode 500 when the error has no statusCode', async () => {
        const socket = createSocket();
        const handler = jest.fn().mockRejectedValue(new Error('unexpected'));
        const wrapped = errorWrapper(socket, handler);

        await wrapped({});

        expect(socket.emit).toHaveBeenCalledWith('error', {
            message: 'unexpected',
            statusCode: 500,
            details: [],
        });
    });

    test('emit "internal server error" when the error has no message', async () => {
        const socket = createSocket();
        const handler = jest.fn().mockRejectedValue({});
        const wrapped = errorWrapper(socket, handler);

        await wrapped({});

        expect(socket.emit).toHaveBeenCalledWith('error', {
            message: 'internal server error',
            statusCode: 500,
            details: [],
        });
    });
});
