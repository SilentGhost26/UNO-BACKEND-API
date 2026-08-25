const createGameCardService = require('../../../src/services/game-card.service');
const { ok, err } = require('../../../src/helpers/result.helper');
const { gameCardRepository, gameRepository, cardRepository, playerRepository, gamePlayerRepository, } = require('../utils/repository-mocks.utils');
const gameCardDto = require('../../../src/dto/game-card.dto');
const cardDto = require('../../../src/dto/card.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');

let gameCardService;

describe('test for game card service', () => {
    beforeEach(() => {
        gameCardService = createGameCardService(
            gameCardRepository,
            gameRepository,
            cardRepository,
            playerRepository,
            gamePlayerRepository,
            gameCardDto,
            cardDto,
            notFoundHelper,
            conflictHelper,
            { ok, err }
        );
    });

    describe('Tests for createDeck', () => {
        test('create a deck successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getByGameId.mockResolvedValue([]);
            cardRepository.findAll.mockResolvedValue([{ id: 'card-1' }, { id: 'card-2' }]);
            gameCardRepository.bulkCreate.mockResolvedValue([{ id: 'gc-1' }]);

            const result = await gameCardService.createDeck('game-1');
            expect(result).toEqual({ ok: true, result: undefined });
            expect(gameCardRepository.bulkCreate).toHaveBeenCalled();
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);

            const result = await gameCardService.createDeck('nonexistent-game');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });

        test('return an error result when the game already has a deck', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getByGameId.mockResolvedValue([{ id: 'existing-deck' }]);

            const result = await gameCardService.createDeck('game-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'Game with ID game-1 already has a deck',
                statusCode: 409,
            });
        });

        test('return an error result when there are no cards initialized', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getByGameId.mockResolvedValue([]);
            cardRepository.findAll.mockResolvedValue([]);

            const result = await gameCardService.createDeck('game-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'Cards are not already initialized',
                statusCode: 503,
            });
        });
    });

    describe('Tests for getByGameId', () => {
        test('get game cards by game id', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getByGameId.mockResolvedValue([
                { gameId: 'game-1', cardId: 'card-2', position: 2, zone: 'DECK' },
                { gameId: 'game-1', cardId: 'card-1', position: 1, zone: 'DECK' },
            ]);

            const result = await gameCardService.getByGameId('game-1');

            expect(result.result).toHaveLength(2);
            expect(result.result[0].cardId).toBe('card-1');
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);

            const result = await gameCardService.getByGameId('nonexistent-game');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for updateGameCard', () => {
        test('update a game card successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            cardRepository.getById.mockResolvedValue({ id: 'card-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: 'gp-1' });
            gameCardRepository.update.mockResolvedValue({
                gameId: 'game-1',
                cardId: 'card-1',
                zone: 'HAND',
                position: null,
                playerId: 'player-1',
            });

            const result = await gameCardService.updateGameCard('game-1', 'card-1', {
                zone: 'HAND',
                playerId: 'player-1',
            });

            expect(result.result.playerId).toBe('player-1');
            expect(gameCardRepository.update).toHaveBeenCalledWith('game-1', 'card-1', expect.objectContaining({ zone: 'HAND', playerId: 'player-1', position: null }));
        });

        test('return an error result when the card does not exist', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            cardRepository.getById.mockResolvedValue(null);

            const result = await gameCardService.updateGameCard('game-1', 'nonexistent-card', { zone: 'HAND' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID nonexistent-card not found',
                statusCode: 404,
            });
        });

        test('return an error result when the player is not registered in the game', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            cardRepository.getById.mockResolvedValue({ id: 'card-1' });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(null);

            const result = await gameCardService.updateGameCard('game-1', 'card-1', { zone: 'HAND', playerId: 'player-1' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player in game with ID player-1 not found',
                statusCode: 404,
            });
        });

        test('return an error result when the game is not playing', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING' });
            cardRepository.getById.mockResolvedValue({ id: 'card-1' });

            const result = await gameCardService.updateGameCard('game-1', 'card-1', { zone: 'HAND' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
        });
    });

    describe('Tests for getTopCardFromDiscard', () => {
        test('get the top card from the deck', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue({
                Card: { id: 'card-1', color: 'RED', value: '1', type: 'NUMBER' },
            });

            const result = await gameCardService.getTopCardFromDiscard('game-1');

            expect(result.result.id).toBe('card-1');
        });

        test('return null when there is no card in the deck', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1' });
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(null);

            const result = await gameCardService.getTopCardFromDiscard('game-1');
            expect(result.ok).toBe(true);
            expect(result.result).toBe(null);
        });
    });
});
