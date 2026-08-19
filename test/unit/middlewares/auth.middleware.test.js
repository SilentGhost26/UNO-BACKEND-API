const validateToken = require('../../../src/middlewares/auth.middleware');
const { tokenService, playerService } = require('../../../src/compositions');

const { createRes } = require('../utils/express-mocks.utils');

jest.mock('../../../src/compositions', () => ({
    tokenService: {
        decodeValidToken: jest.fn(),
    },
    playerService: {
        getLoggedOutDateByPlayerId: jest.fn(),
    },
}));

describe('test for auth middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('return 401 when no token is provided', async () => {
        const req = { headers: {} };
        const res = createRes();
        const next = jest.fn();

        await validateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    test('call next with an error when the token is empty', async () => {
        const req = { headers: { authorization: 'Bearer ' } };
        const res = createRes();
        const next = jest.fn();

        await validateToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Token not entered',
            statusCode: 401,
        }));
    });

    test('attach the decoded player and continue when the token is valid', async () => {
        const req = { headers: { authorization: 'Bearer token' } };
        const res = createRes();
        const next = jest.fn();
        tokenService.decodeValidToken.mockReturnValue({ id: 'player-1', iat: 1700000000 });
        playerService.getLoggedOutDateByPlayerId.mockResolvedValue(null);

        await validateToken(req, res, next);

        expect(req.player).toEqual({ id: 'player-1', iat: 1700000000 });
        expect(next).toHaveBeenCalled();
    });

    test('return 401 when the user session is closed', async () => {
        const req = { headers: { authorization: 'Bearer token' } };
        const res = createRes();
        const next = jest.fn();
        tokenService.decodeValidToken.mockReturnValue({ id: 'player-1', iat: 1700000000 });
        playerService.getLoggedOutDateByPlayerId.mockResolvedValue(new Date('2024-01-01T00:00:00.000Z'));

        await validateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token: user session closed' });
        expect(next).not.toHaveBeenCalled();
    });

    test('forward token errors with a 403 status', async () => {
        const req = { headers: { authorization: 'Bearer token' } };
        const res = createRes();
        const next = jest.fn();
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        tokenService.decodeValidToken.mockImplementation(() => { throw error; });

        await validateToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'invalid signature',
            statusCode: 403,
        }));
    });
});
