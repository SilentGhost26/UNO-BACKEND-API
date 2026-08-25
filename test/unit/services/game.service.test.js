const createGameService = require('../../../src/services/game.service');
const { runValidators, ok } = require('../../../src/helpers/result.helper');
const { gameRepository, playerRepository, gamePlayerRepository } = require('../utils/repository-mocks.utils');
const gameDto = require('../../../src/dto/game.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');
const startGameValidators = require('../../../src/services/validators/game-start.validator');
const finishGameValidators = require('../../../src/services/validators/game-finish.validator');
let gameService;

describe('test for game service', () => {
    beforeEach(() => {
        gameService = createGameService(
            gameRepository,
            playerRepository,
            gamePlayerRepository,
            gameDto,
            notFoundHelper,
            conflictHelper,
            { runValidators, ok },
            startGameValidators,
            finishGameValidators
        )
    });

    describe('Tests for addGame', () => {
        test('add a game and register the owner as the gamePlayer in position 1', async () => {
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gameRepository.create.mockResolvedValue({
                id: 'game-1',
                title: 'UNO',
                maxPlayers: 4,
                status: 'WAITING',
                ownerId: 'owner-1',
                winnerId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
            });
            gamePlayerRepository.create.mockResolvedValue({});

            const result = await gameService.addGame({
                title: 'UNO',
                maxPlayers: 4,
                ownerId: 'owner-1',
            });

            expect(gamePlayerRepository.create).toHaveBeenCalledWith({
                gameId: 'game-1',
                playerId: 'owner-1',
                position: 1,
            });
            expect(result.result.id).toBe('game-1');
            expect(result.result.title).toBe('UNO');
        });

        test('return an error result when the owner does not exist', async () => {
            playerRepository.getById.mockResolvedValue(null);

            const result = await gameService.addGame({
                title: 'UNO',
                maxPlayers: 4,
                ownerId: 'nonexistent-player',
            });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
            expect(playerRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('Tests for findGameById', () => {
        test('get a valid game by its id', async () => {
            gameRepository.getById.mockResolvedValue({
                id: 'game-1',
                title: 'UNO',
                maxPlayers: 4,
                status: 'WAITING',
                ownerId: 'owner-1',
                winnerId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
            });

            const result = await gameService.findGameById('game-1');

            expect(result.result.id).toStrictEqual('game-1');
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);

            const result = await gameService.findGameById('nonexistent-game');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });
    });
    
    describe('Tests for updateGame', () => {
        test('Update succesfully a game', async () => {
            gameRepository.update.mockResolvedValue({
                id: 'game-1',
                title: 'UPDATED GAME',
                maxPlayers: 4,
                status: 'WAITING',
                ownerId: 'owner-1',
                winnerId: null,
                createdAt: '2026-01-01T00:00:00.000Z',
            });

            const result = await gameService.updateGame('game-1', {title: 'UPDATED GAME', maxPlayers: 4});

            expect(result.result.title).toBe('UPDATED GAME');
            expect(result.result.maxPlayers).toBe(4);
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.update.mockResolvedValue(null);
            const result = await gameService.updateGame('nonexistent-game', {title: 'UPDATED GAME', maxPlayers: 4});

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for deleteGame', () => {
        test('delete succesfully a game', async () => {
            gameRepository.remove.mockResolvedValue(true);
            await expect(gameService.deleteGame('game-1'))
            .resolves.toEqual({ ok: true, result: undefined });
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.remove.mockResolvedValue(false);
            const result = await gameService.deleteGame('nonexistent-game');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for start game', () => {
        const waitingGame = { id: 'game-1', status: 'WAITING', ownerId: 'owner-1' };

        test('start succesfully a game', async () => {
            gameRepository.getById.mockResolvedValue(waitingGame);
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);
            gameRepository.update.mockResolvedValue({ ...waitingGame, status: 'PLAYING' });

            await expect(gameService.startGame('game-1', 'owner-1'))
            .resolves.toEqual({ ok: true, result: undefined });
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.startGame('nonexistent-game', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the game is already playing', async () => {
            gameRepository.getById.mockResolvedValue({...waitingGame, status: 'PLAYING'});
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.startGame('game-1', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 already playing',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the game is already finished', async () => {
            gameRepository.getById.mockResolvedValue({...waitingGame, status: 'FINISHED'});
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.startGame('game-1', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 already finished',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when there is not enough players in the game', async () => {
            gameRepository.getById.mockResolvedValue(waitingGame);
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
            ]);

            const result = await gameService.startGame('game-1', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 doesn\'t have enough players',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the player does not exist', async () => {
            gameRepository.getById.mockResolvedValue(waitingGame);
            playerRepository.getById.mockResolvedValue(null);
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.startGame('game-1', 'nonexistent-player');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the player is not the owner', async () => {
            gameRepository.getById.mockResolvedValue(waitingGame);
            playerRepository.getById.mockResolvedValue({ id: 'another-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.startGame('game-1', 'another-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID another-1 is not the owner',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('Tests for finishGame', () => {
        const playingGame = { id: 'game-1', status: 'PLAYING', ownerId: 'owner-1' };

        test('finish succesfully a game', async () => {
            gameRepository.getById.mockResolvedValue(playingGame);
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gameRepository.update.mockResolvedValue({ ...playingGame, status: 'PLAYING' });

            await expect(gameService.finishGame('game-1', 'owner-1'))
            .resolves.toEqual({ ok: true, result: undefined });
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.finishGame('nonexistent-game', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the game is not playing', async () => {
            gameRepository.getById.mockResolvedValue({...playingGame, status: 'WAITING'});
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.finishGame('game-1', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 it\'s not playing',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the game is already finished', async () => {
            gameRepository.getById.mockResolvedValue({...playingGame, status: 'FINISHED'});
            playerRepository.getById.mockResolvedValue({ id: 'owner-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.finishGame('game-1', 'owner-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 already finished',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the player does not exist', async () => {
            gameRepository.getById.mockResolvedValue(playingGame);
            playerRepository.getById.mockResolvedValue(null);
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.finishGame('game-1', 'nonexistent-player');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID nonexistent-player not found',
                statusCode: 404,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });

        test('return an error result when the player is not the owner', async () => {
            gameRepository.getById.mockResolvedValue(playingGame);
            playerRepository.getById.mockResolvedValue({ id: 'another-1' });
            gamePlayerRepository.getByGameId.mockResolvedValue([
                {
                    id: 'player-1'
                },
                {
                    id: 'player-2'
                }
            ]);

            const result = await gameService.finishGame('game-1', 'another-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID another-1 is not the owner',
                statusCode: 409,
            });
            expect(gameRepository.update).not.toHaveBeenCalled();
        });
    });
});