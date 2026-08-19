const jwt = require('jsonwebtoken');
const createTokenService = require('../../../src/services/token.service');

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

let tokenService;

describe('test for token service', () => {
    beforeEach(() => {
        tokenService = createTokenService();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('Tests for createUserToken', () => {
        test('create a jwt token successfully', () => {
            jwt.sign.mockReturnValue('jwt-token');

            const result = tokenService.createUserToken({ id: 'player-1' });

            expect(result).toBe('jwt-token');
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'player-1' },
                'test-secret',
                { expiresIn: '24h' }
            );
        });
    });

    describe('Tests for decodeValidToken', () => {
        test('decode a valid jwt token successfully', () => {
            jwt.verify.mockReturnValue({ id: 'player-1' });

            const result = tokenService.decodeValidToken('jwt-token');

            expect(result).toEqual({ id: 'player-1' });
            expect(jwt.verify).toHaveBeenCalledWith('jwt-token', 'test-secret');
        });
    });
});
