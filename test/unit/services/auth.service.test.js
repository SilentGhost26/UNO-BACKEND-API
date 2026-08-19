const bcrypt = require('bcrypt');
const createAuthService = require('../../../src/services/auth.service');
const { playerRepository } = require('../utils/repository-mocks.utils');
const playerDto = require('../../../src/dto/player.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

let authService;
let tokenService;

describe('test for auth service', () => {
    beforeEach(() => {
        tokenService = { createUserToken: jest.fn() };
        authService = createAuthService(
            tokenService,
            playerRepository,
            notFoundHelper,
            conflictHelper,
            playerDto
        );
    });

    describe('Tests for registerPlayer', () => {
        test('register a player successfully', async () => {
            bcrypt.hash.mockResolvedValue('hashed-password');
            playerRepository.getByEmail.mockResolvedValue(null);
            playerRepository.create.mockResolvedValue({
                id: 'player-1',
                name: 'Ana',
                age: 22,
                email: 'ana@test.com',
                password: 'hashed-password',
                createdAt: '2026-01-01T00:00:00.000Z',
            });

            const result = await authService.registerPlayer({
                name: 'Ana',
                age: 22,
                email: 'ana@test.com',
                password: 'secret',
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
            expect(playerRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                password: 'hashed-password',
                email: 'ana@test.com',
            }));
            expect(result.email).toBe('ana@test.com');
        });

        test('throw error 409 when the email is already registered', async () => {
            bcrypt.hash.mockResolvedValue('hashed-password');
            playerRepository.getByEmail.mockResolvedValue({ id: 'player-1' });

            await expect(authService.registerPlayer({
                name: 'Ana',
                age: 22,
                email: 'ana@test.com',
                password: 'secret',
            })).rejects.toMatchObject({
                message: 'The email is already registered',
                statusCode: 409,
            });
        });

        test('throw an error when bcrypt hash fails', async () => {
            bcrypt.hash.mockRejectedValue(new Error('hash failed'));

            await expect(authService.registerPlayer({
                name: 'Ana',
                age: 22,
                email: 'ana@test.com',
                password: 'secret',
            })).rejects.toThrow('Error encripting the password');
        });
    });

    describe('Tests for authenticatePlayer', () => {
        test('authenticate a player successfully', async () => {
            playerRepository.getByEmail.mockResolvedValue({
                id: 'player-1',
                password: 'hashed-password',
            });
            bcrypt.compare.mockResolvedValue(true);
            tokenService.createUserToken.mockReturnValue('jwt-token');

            const result = await authService.authenticatePlayer('ana@test.com', 'secret');

            expect(result).toBe('jwt-token');
            expect(tokenService.createUserToken).toHaveBeenCalledWith(expect.objectContaining({ id: 'player-1' }));
        });

        test('throw error 401 when the player is not registered', async () => {
            playerRepository.getByEmail.mockResolvedValue(null);

            await expect(authService.authenticatePlayer('unknown@test.com', 'secret'))
                .rejects.toMatchObject({
                    message: 'player not registered',
                    statusCode: 401,
                });
        });

        test('throw error 401 when the password is incorrect', async () => {
            playerRepository.getByEmail.mockResolvedValue({
                id: 'player-1',
                password: 'hashed-password',
            });
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.authenticatePlayer('ana@test.com', 'secret'))
                .rejects.toMatchObject({
                    message: 'incorrect email or password',
                    statusCode: 401,
                });
        });
    });

    describe('Tests for logoutPlayer', () => {
        test('logout a player successfully', async () => {
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });

            await expect(authService.logoutPlayer('player-1')).resolves.toBeUndefined();
            expect(playerRepository.update).toHaveBeenCalledWith('player-1', expect.objectContaining({ loggedOutAt: expect.any(Number) }));
        });

        test('throw error 404 when the player does not exist', async () => {
            playerRepository.getById.mockResolvedValue(null);

            await expect(authService.logoutPlayer('nonexistent-player')).rejects.toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });
    });
});
