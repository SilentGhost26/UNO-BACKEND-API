const createPlayerService = require('../../../src/services/player.service');
const { playerRepository } = require('../utils/repository-mocks.utils');
const playerDto = require('../../../src/dto/player.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');

let playerService;

describe('test for player service', () => {
    beforeEach(() => {
        playerService = createPlayerService(
            playerRepository,
            playerDto,
            notFoundHelper,
            conflictHelper
        );
    });

    describe('Tests for findPlayerById', () => {
        test('get a player by its id', async () => {
            playerRepository.getById.mockResolvedValue({
                id: 'player-1',
                name: 'Ana',
                age: 22,
                email: 'ana@test.com',
                createdAt: '2026-01-01T00:00:00.000Z',
            });

            const result = await playerService.findPlayerById('player-1');

            expect(result.id).toBe('player-1');
            expect(result.email).toBe('ana@test.com');
        });

        test('throw error 404 when the player does not exist', async () => {
            playerRepository.getById.mockResolvedValue(null);

            await expect(playerService.findPlayerById('nonexistent-player')).rejects.toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for updatePlayer', () => {
        test('update a player successfully', async () => {
            playerRepository.update.mockResolvedValue({
                id: 'player-1',
                name: 'Ana Updated',
                age: 23,
                email: 'ana.updated@test.com',
                createdAt: '2026-01-01T00:00:00.000Z',
            });

            const result = await playerService.updatePlayer('player-1', {
                name: 'Ana Updated',
                age: 23,
                email: 'ana.updated@test.com',
            });

            expect(result.name).toBe('Ana Updated');
            expect(result.email).toBe('ana.updated@test.com');
        });

        test('throw error 404 when the player does not exist', async () => {
            playerRepository.update.mockResolvedValue(null);

            await expect(playerService.updatePlayer('nonexistent-player', { name: 'Ana' })).rejects.toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for deletePlayer', () => {
        test('delete a player successfully', async () => {
            playerRepository.remove.mockResolvedValue(true);

            await expect(playerService.deletePlayer('player-1')).resolves.toBeUndefined();
        });

        test('throw error 404 when the player does not exist', async () => {
            playerRepository.remove.mockResolvedValue(false);

            await expect(playerService.deletePlayer('nonexistent-player')).rejects.toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for getLoggedOutDateByPlayerId', () => {
        test('return the logout date when it exists', async () => {
            playerRepository.getLoggedOutDateById.mockResolvedValue('2026-01-02T00:00:00.000Z');

            const result = await playerService.getLoggedOutDateByPlayerId('player-1');

            expect(result).toBe('2026-01-02T00:00:00.000Z');
        });

        test('return null when the player has no logout date', async () => {
            playerRepository.getLoggedOutDateById.mockResolvedValue(null);

            const result = await playerService.getLoggedOutDateByPlayerId('player-1');

            expect(result).toBeNull();
        });
    });
});
