const { authService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createAuthController = require('../../../src/controllers/auth.controller');

let authController;

describe('test for auth controller', () => {
    beforeEach(() => {
        authController = createAuthController(authService);
    });

    describe('Tests for registerPlayer', () => {
        test('register the player from the request body and responds 201 with the created player', async () => {
            const req = { body: { name: 'Ada', age: 30, email: 'ada@example.com', password: 'secret123' } };
            const res = createRes();
            authService.registerPlayer.mockResolvedValue({ id: 'player-1', name: 'Ada' });

            await authController.registerPlayer(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 'player-1', name: 'Ada' });
        });

    });
    describe('Tests for authenticatePlayer', () => {

        test('authenticate a player from the request body and responds 200 with a token', async () => {
            const req = { body: { email: 'ada@example.com', password: 'secret123' } };
            const res = createRes();
            authService.authenticatePlayer.mockResolvedValue('secret-token');
            
            await authController.authenticatePlayer(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ access_token: 'secret-token' });
        });
    });

    describe('Tests for logoutPlayer', () => {

        test('logout a player from the request player and responds 200', async () => {
            const req = { player: { id: 'player-1' } };
            const res = createRes();
            authService.logoutPlayer.mockResolvedValue();
            
            await authController.logoutPlayer(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "User logged out succesfully" });
        });
    });
});