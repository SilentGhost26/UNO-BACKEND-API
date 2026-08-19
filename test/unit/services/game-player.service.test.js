const createGamePlayerService = require('../../../src/services/game-player.service');
const { gamePlayerRepository, gameRepository, playerRepository } = require('../utils/repository-mocks.utils');
const gamePlayerDto = require('../../../src/dto/game-player.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');

let gamePlayerService;

describe('test for game player service', () => {
    beforeEach(() => {
        gamePlayerService = createGamePlayerService(
            gamePlayerRepository,
            gameRepository,
            playerRepository,
            gamePlayerDto,
            notFoundHelper,
            conflictHelper
        );
    });

    describe('Tests for addGamePlayer', () => {
        test('add a player to a waiting game successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);
            gamePlayerRepository.getByGameId.mockResolvedValue([
                { position: 1 },
                { position: 2 },
            ]);
            gamePlayerRepository.create.mockResolvedValue({ id: 'game-player-1', gameId: 'game-1', playerId: 'player-1', position: 3 });

            const result = await gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' });

            expect(gamePlayerRepository.create).toHaveBeenCalledWith(expect.objectContaining({ position: 3 }));
            expect(result.playerId).toBe('player-1');
        });

        test('throw error 404 when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);

            await expect(gamePlayerService.addGamePlayer({ gameId: 'nonexistent-game', playerId: 'player-1' })).rejects.toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });

        test('throw error 404 when the player does not exist', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue(null);

            await expect(gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'nonexistent-player' })).rejects.toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });

        test('throw error 409 when the player is already registered', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: 'existing' });

            await expect(gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' })).rejects.toMatchObject({
                message: 'player with ID player-1 already registered in game with ID game-1',
                statusCode: 409,
            });
        });

        test('throw error 409 when the game is not waiting', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);

            await expect(gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' })).rejects.toMatchObject({
                message: 'Game swith ID game-1 is not in waiting state',
                statusCode: 409,
            });
        });

        test('throw error 409 when the game is full', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 2 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);
            gamePlayerRepository.getByGameId.mockResolvedValue([{ position: 1 }, { position: 2 }]);

            await expect(gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' })).rejects.toMatchObject({
                message: 'The game with ID game-1 is full',
                statusCode: 409,
            });
        });
    });

    describe('Tests for findScoresBygameId', () => {
        test('find scores by game id', async () => {
            gamePlayerRepository.getByGameId.mockResolvedValue([
                { id: 'gp-1', score: 10, Player: { name: 'Ana' } },
                { id: 'gp-2', score: 20, Player: { name: 'Luis' } },
            ]);

            const result = await gamePlayerService.findScoresBygameId('game-1');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Ana');
        });
    });

    describe('Tests for updateScore', () => {
        test('update a score successfully', async () => {
            gamePlayerRepository.update.mockResolvedValue({ id: 'gp-1', score: 25, Player: { name: 'Ana' } });

            const result = await gamePlayerService.updateScore('gp-1', 25);

            expect(result.score).toBe(25);
        });

        test('throw error 404 when the score does not exist', async () => {
            gamePlayerRepository.update.mockResolvedValue(null);

            await expect(gamePlayerService.updateScore('nonexistent-game-player', 25)).rejects.toMatchObject({
                message: 'gamePlayer with ID nonexistent-game-player not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for deleteGamePlayer', () => {
        test('delete a player from a game successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: 'gp-1' });

            await expect(gamePlayerService.deleteGamePlayer('game-1', 'player-1')).resolves.toBeUndefined();
            expect(gamePlayerRepository.remove).toHaveBeenCalledWith('gp-1');
        });

        test('throw error 409 when the game is already finished', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'FINISHED' });

            await expect(gamePlayerService.deleteGamePlayer('game-1', 'player-1')).rejects.toMatchObject({
                message: 'game with ID game-1 already finished',
                statusCode: 409,
            });
        });

        test('throw error 404 when the player is not registered in the game', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);

            await expect(gamePlayerService.deleteGamePlayer('game-1', 'player-1')).rejects.toMatchObject({
                message: 'player in game with ID player-1 not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for findScoreById', () => {
        test('find a score by its id', async () => {
            gamePlayerRepository.getById.mockResolvedValue({ id: 'gp-1', score: 10, Player: { name: 'Ana' } });

            const result = await gamePlayerService.findScoreById('gp-1');

            expect(result.name).toBe('Ana');
        });

        test('throw error 404 when the score does not exist', async () => {
            gamePlayerRepository.getById.mockResolvedValue(null);

            await expect(gamePlayerService.findScoreById('nonexistent-score')).rejects.toMatchObject({
                message: 'score with ID nonexistent-score not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for getPlayersByGameId', () => {
        test('get players by game id', async () => {
            gamePlayerRepository.getByGameId.mockResolvedValue([
                { id: 'gp-1', playerId: 'player-1', Player: { name: 'Ana' } },
            ]);

            const result = await gamePlayerService.getPlayersByGameId('game-1');

            expect(result[0].name).toBe('Ana');
        });
    });

    describe('Tests for getCurrentPlayerToPlay', () => {
        test('get the current player to play', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue({ id: 'gp-1', playerId: 'player-1', Player: { name: 'Ana' } });

            const result = await gamePlayerService.getCurrentPlayerToPlay('game-1');

            expect(result.name).toBe('Ana');
        });

        test('throw error 409 when the game is not in playing state', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });

            await expect(gamePlayerService.getCurrentPlayerToPlay('game-1')).rejects.toMatchObject({
                message: 'game with ID $game-1 is not in playing state',
                statusCode: 409,
            });
        });
    });
});
