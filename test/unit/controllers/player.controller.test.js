const { playerService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createPlayerController = require('../../../src/controllers/player.controller');

let playerController;

describe('test for player controller', () => {
    beforeEach(() => {
        playerController = createPlayerController(playerService);
    });

    describe('Tests for getPlayerById', () => {
        test('get a player from the request params and responds 200', async () => {
            const req = { params: { id: 'player-1' } };
            const res = createRes();
            playerService.findPlayerById.mockResolvedValue({ ok: true, result: { id: 'player-1', name: 'Ada' } });

            await playerController.getPlayerById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'player-1', name: 'Ada' });
        });
    });

    describe('Tests for updatePlayer', () => {
        test('update a player from the request body and responds 200', async () => {
            const req = { player: { id: 'player-1' }, body: { name: 'Ada Updated' } };
            const res = createRes();
            playerService.updatePlayer.mockResolvedValue({ ok: true, result: { id: 'player-1', name: 'Ada Updated' } });

            await playerController.updatePlayer(req, res);

            expect(playerService.updatePlayer).toHaveBeenCalledWith('player-1', { name: 'Ada Updated' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'player-1', name: 'Ada Updated' });
        });
    });

    describe('Tests for deletePlayer', () => {
        test('delete a player from the request player and responds 204', async () => {
            const req = { player: { id: 'player-1' } };
            const res = createRes();
            playerService.deletePlayer.mockResolvedValue({ ok: true });

            await playerController.deletePlayer(req, res);

            expect(playerService.deletePlayer).toHaveBeenCalledWith('player-1');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('Tests for getProfile', () => {
        test('get the profile of the authenticated player and responds 200', async () => {
            const req = { player: { id: 'player-1' } };
            const res = createRes();
            playerService.findPlayerById.mockResolvedValue({ ok: true, result: { id: 'player-1', name: 'Ada' } });

            await playerController.getProfile(req, res);

            expect(playerService.findPlayerById).toHaveBeenCalledWith('player-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'player-1', name: 'Ada' });
        });
    });
});
