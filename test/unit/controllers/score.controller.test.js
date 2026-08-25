const { gamePlayerService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createScoreController = require('../../../src/controllers/score.controller');

let scoreController;

describe('test for score controller', () => {
    beforeEach(() => {
        scoreController = createScoreController(gamePlayerService);
    });

    describe('Tests for getScoreById', () => {
        test('get a score by id and responds 200', async () => {
            const req = { params: { id: 'score-1' } };
            const res = createRes();
            gamePlayerService.findScoreById.mockResolvedValue({ ok: true, result: { id: 'score-1', score: 10 } });

            await scoreController.getScoreById(req, res);

            expect(gamePlayerService.findScoreById).toHaveBeenCalledWith('score-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'score-1', score: 10 });
        });
    });

    describe('Tests for updateScore', () => {
        test('update a score and responds 200', async () => {
            const req = { params: { id: 'score-1' }, body: { score: 20 } };
            const res = createRes();
            gamePlayerService.updateScore.mockResolvedValue({ ok: true, result: { id: 'score-1', score: 20 } });

            await scoreController.updateScore(req, res);

            expect(gamePlayerService.updateScore).toHaveBeenCalledWith('score-1', 20);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'score-1', score: 20 });
        });
    });

    describe('Tests for getScoresByGameId', () => {
        test('get scores for a game and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gamePlayerService.findScoresBygameId.mockResolvedValue({ ok: true, result: [{ id: 'score-1', score: 10 }] });

            await scoreController.getScoresByGameId(req, res);

            expect(gamePlayerService.findScoresBygameId).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ gameId: 'game-1', scores: [{ id: 'score-1', score: 10 }] });
        });
    });
});
