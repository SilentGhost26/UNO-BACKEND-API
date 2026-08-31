jest.mock('../../../src/compositions', () => ({
    tokenService: { decodeValidToken: jest.fn() },
    playerService: { getLoggedOutDateByPlayerId: jest.fn() },
}));

const { tokenService, playerService } = require('../../../src/compositions');
const validateToken = require('../../../src/websocket/middlewares/auth.socket-middleware');

describe('tests for auth socket middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('call next with an error when no token is provided', async () => {
        const socket = { handshake: { auth: {} } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'no token provided' }));
        expect(tokenService.decodeValidToken).not.toHaveBeenCalled();
    });

    test('call next with an error when the token is empty after stripping the Bearer prefix', async () => {
        const socket = { handshake: { auth: { token: 'Bearer ' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token not entered' }));
        expect(tokenService.decodeValidToken).not.toHaveBeenCalled();
    });

    test('attach the decoded player to the socket and call next with no error when the token is valid', async () => {
        const decoded = { id: 'player-1', iat: 1700000000 };
        tokenService.decodeValidToken.mockReturnValue(decoded);
        playerService.getLoggedOutDateByPlayerId.mockResolvedValue(null);
        const socket = { handshake: { auth: { token: 'valid-token' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(tokenService.decodeValidToken).toHaveBeenCalledWith('valid-token');
        expect(socket.player).toEqual(decoded);
        expect(next).toHaveBeenCalledWith();
    });

    test('strip the Bearer prefix before decoding the token', async () => {
        const decoded = { id: 'player-1', iat: 1700000000 };
        tokenService.decodeValidToken.mockReturnValue(decoded);
        playerService.getLoggedOutDateByPlayerId.mockResolvedValue(null);
        const socket = { handshake: { auth: { token: 'Bearer valid-token' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(tokenService.decodeValidToken).toHaveBeenCalledWith('valid-token');
    });

    test('call next with a 401 error when the session was logged out after the token was issued', async () => {
        const decoded = { id: 'player-1', iat: 1700000000 };
        tokenService.decodeValidToken.mockReturnValue(decoded);
        playerService.getLoggedOutDateByPlayerId.mockResolvedValue(new Date((decoded.iat + 1000) * 1000));
        const socket = { handshake: { auth: { token: 'valid-token' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Invalid token: user session closed',
            data: { statusCode: 401 },
        }));
        expect(socket.player).toBeUndefined();
    });

    test('call next with statusCode 401 when the token is expired', async () => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        tokenService.decodeValidToken.mockImplementation(() => { throw error; });
        const socket = { handshake: { auth: { token: 'expired-token' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'jwt expired', statusCode: 401 }));
    });

    test('call next with statusCode 403 when the token is invalid for other reasons', async () => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        tokenService.decodeValidToken.mockImplementation(() => { throw error; });
        const socket = { handshake: { auth: { token: 'bad-token' } } };
        const next = jest.fn();

        await validateToken(socket, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'invalid signature', statusCode: 403 }));
    });
});
