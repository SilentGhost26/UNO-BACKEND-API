const { gameService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const { ok } = require('../../../src/helpers/result.helper');
const createGameController = require('../../../src/controllers/game.controller');

let gameController;

describe('test for game controller', () => {
    beforeEach(() => {
        gameController = createGameController(gameService);
    });

    describe('Tests for addGame', () => {
        test('create a game from the request body and responds 201', async () => {
            const req = { body: { title: 'UNO', maxPlayers: 4 }, player: { id: 'player-1' } };
            const res = createRes();
            gameService.addGame.mockResolvedValue({ ok: true, result: { id: 'game-1', title: 'UNO' } });

            await gameController.addGame(req, res);

            expect(gameService.addGame).toHaveBeenCalledWith({ title: 'UNO', maxPlayers: 4, ownerId: 'player-1' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 'game-1', title: 'UNO' });
        });
    });

    describe('Tests for getGameById', () => {
        test('get a game by id and responds 200', async () => {
            const req = { params: { id: 'game-1' } };
            const res = createRes();
            gameService.findGameById.mockResolvedValue({ ok: true, result: { id: 'game-1', title: 'UNO' } });

            await gameController.getGameById(req, res);

            expect(gameService.findGameById).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'game-1', title: 'UNO' });
        });
    });

    describe('Tests for getGameByIdWithRules', () => {
        test('get a game with rules by id and responds 200', async () => {
            const req = { params: { id: 'game-1' } };
            const res = createRes();
            gameService.findGameByIdWithRules.mockResolvedValue({
                ok: true,
                result: {
                    id: 'game-1',
                    title: 'UNO',
                    rules: {
                        allowDrawFour: true,
                        allowAccumulateDraw: false,
                        allowReverse: true,
                    }
                }
            });

            await gameController.getGameByIdWithRules(req, res);

            expect(gameService.findGameByIdWithRules).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                id: 'game-1',
                title: 'UNO',
                rules: {
                    allowDrawFour: true,
                    allowAccumulateDraw: false,
                    allowReverse: true,
                }
            });
        });
    });

    describe('Tests for updateGame', () => {
        test('update a game and responds 200', async () => {
            const req = { params: { id: 'game-1' }, body: { title: 'Updated' } };
            const res = createRes();
            gameService.updateGame.mockResolvedValue({ ok: true, result: { id: 'game-1', title: 'Updated' } });

            await gameController.updateGame(req, res);

            expect(gameService.updateGame).toHaveBeenCalledWith('game-1', { title: 'Updated' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'game-1', title: 'Updated' });
        });
    });

    describe('Tests for deleteGame', () => {
        test('delete a game and responds 204', async () => {
            const req = { params: { id: 'game-1' } };
            const res = createRes();
            gameService.deleteGame.mockResolvedValue({ ok: true });

            await gameController.deleteGame(req, res);

            expect(gameService.deleteGame).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('Tests for startGame', () => {
        test('start a game and responds 200', async () => {
            const req = { params: { id: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            gameService.startGame.mockResolvedValue({ ok: true });

            await gameController.startGame(req, res);

            expect(gameService.startGame).toHaveBeenCalledWith('game-1', 'player-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Game started succesfully' });
        });
    });

    describe('Tests for finishGame', () => {
        test('finish a game and responds 200', async () => {
            const req = { params: { id: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            gameService.finishGame.mockResolvedValue({ ok: true });

            await gameController.finishGame(req, res);

            expect(gameService.finishGame).toHaveBeenCalledWith('game-1', 'player-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Game ended succesfully' });
        });
    });

    describe('Tests for getGameStatus', () => {
        test('get a game status and responds 200', async () => {
            const req = { params: { id: 'game-1' } };
            const res = createRes();
            gameService.getGameStatus.mockResolvedValue({ ok: true, result: { id: 'game-1', title: 'UNO' } });

            await gameController.getGameStatus(req, res);

            expect(gameService.getGameStatus).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'game-1', title: 'UNO' });
        });
    });
});
