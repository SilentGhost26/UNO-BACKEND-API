const { gamePlayerService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createGamePlayerController = require('../../../src/controllers/game-player.controller');

let gamePlayerController;

describe('test for game player controller', () => {
    beforeEach(() => {
        gamePlayerController = createGamePlayerController(gamePlayerService);
    });

    describe('Tests for addGamePlayer', () => {
        test('add a player to a game and responds 201', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            gamePlayerService.addGamePlayer.mockResolvedValue({ ok: true, result: { id: 'gp-1' } });

            await gamePlayerController.addGamePlayer(req, res);

            expect(gamePlayerService.addGamePlayer).toHaveBeenCalledWith({ gameId: 'game-1', playerId: 'player-1' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 'gp-1' });
        });
    });

    describe('Tests for removeGamePlayer', () => {
        test('remove a player from a game and responds 204', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            gamePlayerService.deleteGamePlayer.mockResolvedValue({ ok: true, result: undefined });

            await gamePlayerController.removeGamePlayer(req, res);

            expect(gamePlayerService.deleteGamePlayer).toHaveBeenCalledWith('game-1', 'player-1');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith({ message: 'Player left the game succesfully' });
        });
    });

    describe('Tests for getPlayersInGame', () => {
        test('get players in a game and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gamePlayerService.getPlayersByGameId.mockResolvedValue({ ok: true, result: [{ id: 'gp-1' }] });

            await gamePlayerController.getPlayersInGame(req, res);

            expect(gamePlayerService.getPlayersByGameId).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ gameId: 'game-1', players: [{ id: 'gp-1' }] });
        });
    });

    describe('Tests for getCurrentPlayerToPlay', () => {
        test('get the current player to play and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gamePlayerService.getCurrentPlayerToPlay.mockResolvedValue({ ok: true, result: { id: 'player-1' } });

            await gamePlayerController.getCurrentPlayerToPlay(req, res);

            expect(gamePlayerService.getCurrentPlayerToPlay).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ gameId: 'game-1', player: { id: 'player-1' } });
        });
    });
});
