const {
    registerAndLogin,
    createGame,
    joinGame,
    leaveGame,
    getGameStatus
} = require('./utils/game.util');

describe('E2E: Game session management (joining/leaving before a match starts)', () => {
    let owner;
    let guest;
    let gameId;

    beforeAll(async () => {
        owner = await registerAndLogin('sessionOwner');
        guest = await registerAndLogin('sessionGuest');

        const gameResponse = await createGame(owner.token);
        gameId = gameResponse.body.id;

        await joinGame(gameId, guest.token);
    });

    test('DELETE /games/:gameId/players lets a non-owner player leave without affecting the game', async () => {
        const response = await leaveGame(gameId, guest.token);
        expect(response.status).toBe(204);

        // side effect: the game itself still exists and is still WAITING, just with one fewer player
        const statusResponse = await getGameStatus(gameId);
        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.game.status).toBe('WAITING');
        expect(statusResponse.body.players).toHaveLength(1);
    });

    test('DELETE /games/:gameId/players fails if that player already left', async () => {
        const response = await leaveGame(gameId, guest.token);
        expect(response.status).toBe(404);
    });

    test('DELETE /games/:gameId/players removes the whole game when the OWNER leaves a WAITING game', async () => {
        const response = await leaveGame(gameId, owner.token);
        expect(response.status).toBe(204);

        // side effect: the game record is gone entirely (soft-deleted), so fetching its status now returns 404
        const statusResponse = await getGameStatus(gameId);
        expect(statusResponse.status).toBe(404);
    });
});
