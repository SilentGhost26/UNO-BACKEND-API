const createHistoryService = require('../../../src/services/history.service');
const { ok } = require('../../../src/helpers/result.helper');
const { historyRepository, gameRepository } = require('../utils/repository-mocks.utils');
const notFoundHelper = require('../../../src/helpers/not-found.helper');

let historyService;

describe('test for history service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        historyService = createHistoryService(
            historyRepository,
            gameRepository,
            notFoundHelper,
            { ok },
        );
    });

    describe('Tests for getGameHistory', () => {
        test('get the history of a game successfully', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            historyRepository.getByGameId.mockResolvedValue([
                { action: 'PLAY_CARD', Player: { name: 'Ana' } },
                { action: 'DRAW_CARD', Player: { name: 'Luis' } },
            ]);

            const result = await historyService.getGameHistory('game-1');

            expect(result.ok).toBe(true);
            expect(result.result).toEqual([
                { action: 'PLAY_CARD', player: 'Ana' },
                { action: 'DRAW_CARD', player: 'Luis' },
            ]);
            expect(historyRepository.getByGameId).toHaveBeenCalledWith('game-1');
        });

        test('return an empty list when the game has no history yet', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING' });
            historyRepository.getByGameId.mockResolvedValue([]);

            const result = await historyService.getGameHistory('game-1');

            expect(result.ok).toBe(true);
            expect(result.result).toEqual([]);
        });

        test('return an error result when the game does not exist', async () => {
            gameRepository.getById.mockResolvedValue(null);

            const result = await historyService.getGameHistory('nonexistent-game');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
            expect(historyRepository.getByGameId).not.toHaveBeenCalled();
        });
    });
});
