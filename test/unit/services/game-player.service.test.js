const createGamePlayerService = require('../../../src/services/game-player.service');
const { runValidators, ok } = require('../../../src/helpers/result.helper');
const { gamePlayerRepository, gameRepository, playerRepository } = require('../utils/repository-mocks.utils');
const gamePlayerDto = require('../../../src/dto/game-player.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');
const addGamePlayerValidators = require('../../../src/services/validators/add-game-player.validator');
let gamePlayerService;

describe('test for game player service', () => {
    beforeEach(() => {
        gamePlayerService = createGamePlayerService(
            gamePlayerRepository,
            gameRepository,
            playerRepository,
            gamePlayerDto,
            notFoundHelper,
            conflictHelper,
            { runValidators, ok },
            addGamePlayerValidators,
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
            expect(result.result.playerId).toBe('player-1');
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);
            playerRepository.getById.mockResolvedValue({id: 'player-1'});

            const result = await gamePlayerService.addGamePlayer({ gameId: 'nonexistent-game', playerId: 'player-1' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });

        test('return an error result when the player does not exist', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue(null);

            const result = await gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'nonexistent-player' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
        });

        test('return an error result when the player is already registered', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: 'existing' });

            const result = await gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID player-1 already registered in game with ID game-1',
                statusCode: 409,
            });
        });

        test('return an error result when the game is not waiting', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING', maxPlayers: 4 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);

            const result = await gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'Game with ID game-1 is not in waiting state',
                statusCode: 409,
            });
        });

        test('return an error result when the game is full', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', maxPlayers: 2 });
            playerRepository.getById.mockResolvedValue({ id: 'player-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);
            gamePlayerRepository.getByGameId.mockResolvedValue([{ position: 1 }, { position: 2 }]);

            const result = await gamePlayerService.addGamePlayer({ gameId: 'game-1', playerId: 'player-1' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
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

            expect(result.result).toHaveLength(2);
            expect(result.result[0].name).toBe('Ana');
        });
    });

    describe('Tests for updateScore', () => {
        test('update a score successfully', async () => {
            gamePlayerRepository.update.mockResolvedValue({ id: 'gp-1', score: 25, Player: { name: 'Ana' } });

            const result = await gamePlayerService.updateScore('gp-1', 25);

            expect(result.result.score).toBe(25);
        });

        test('return an error result when the score does not exist', async () => {
            gamePlayerRepository.update.mockResolvedValue(null);

            const result = await gamePlayerService.updateScore('nonexistent-game-player', 25);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'gamePlayer with ID nonexistent-game-player not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for deleteGamePlayer', () => {
        test('delete a player from a game successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: 'gp-1' });

            const result = await gamePlayerService.deleteGamePlayer('game-1', 'player-1');
            expect(result).toEqual({ ok: true, result: undefined });
            expect(gamePlayerRepository.remove).toHaveBeenCalledWith('gp-1');
        });

        test('return an error result when the game is already finished', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'FINISHED' });

            const result = await gamePlayerService.deleteGamePlayer('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 already finished',
                statusCode: 409,
            });
        });

        test('return an error result when the player is not registered in the game', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);

            const result = await gamePlayerService.deleteGamePlayer('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player in game with ID player-1 not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for findScoreById', () => {
        test('find a score by its id', async () => {
            gamePlayerRepository.getById.mockResolvedValue({ id: 'gp-1', score: 10, Player: { name: 'Ana' } });

            const result = await gamePlayerService.findScoreById('gp-1');

            expect(result.result.name).toBe('Ana');
        });

        test('return an error result when the score does not exist', async () => {
            gamePlayerRepository.getById.mockResolvedValue(null);

            const result = await gamePlayerService.findScoreById('nonexistent-score');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
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

            expect(result.result[0].name).toBe('Ana');
        });
    });

    describe('Tests for getCurrentPlayerToPlay', () => {
        test('get the current player to play', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue({ id: 'gp-1', playerId: 'player-1', Player: { name: 'Ana' } });

            const result = await gamePlayerService.getCurrentPlayerToPlay('game-1');

            expect(result.result.name).toBe('Ana');
        });

        test('return an error result when the game is not in playing state', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });

            const result = await gamePlayerService.getCurrentPlayerToPlay('game-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID $game-1 is not in playing state',
                statusCode: 409,
            });
        });
    });
});
