const { historyService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createHistoryController = require('../../../src/controllers/history.controller');

let historyController;

describe('test for history controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        historyController = createHistoryController(historyService);
    });

    describe('Tests for getGameHistory', () => {
        test('get the history of a game and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            historyService.getGameHistory.mockResolvedValue({
                ok: true,
                result: [
                    { action: 'PLAY_CARD', player: 'Ana' },
                    { action: 'DRAW_CARD', player: 'Luis' },
                ],
            });

            await historyController.getGameHistory(req, res);

            expect(historyService.getGameHistory).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                gameId: 'game-1',
                history: [
                    { action: 'PLAY_CARD', player: 'Ana' },
                    { action: 'DRAW_CARD', player: 'Luis' },
                ],
            });
        });

        test('calls next with the error when the game does not exist', async () => {
            const req = { params: { gameId: 'nonexistent-game' } };
            const res = createRes();
            const next = jest.fn();
            const error = new Error('game with ID nonexistent-game not found');
            error.statusCode = 404;
            historyService.getGameHistory.mockResolvedValue({ ok: false, error });

            await historyController.getGameHistory(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
