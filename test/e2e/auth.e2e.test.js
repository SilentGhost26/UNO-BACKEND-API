const fetchRequest = require('./utils/request.util');

describe('Tests for player authentication', () => {
    const uniqueEmail = `player${Date.now()}@test.com`;
    test('POST /auth/register creates a new player', async () => {
        const response = await fetchRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test Player',
                age: 25,
                email: uniqueEmail,
                password: 'Secret123!'
            }),
        });
 
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(uniqueEmail);
        expect(response.body).not.toHaveProperty('password');
    });

    test('POST /auth/login login returns a JWT token and playerId', async () => {
        const response = await fetchRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: uniqueEmail,
                password: 'Secret123!'
            }),
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('access_token');
        expect(typeof response.body.access_token).toBe('string');
    });

    test('POST /auth/login fails with wrong password', async () => {
        const response = await fetchRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: uniqueEmail,
                password: 'wrong'
            }),
        });

        expect(response.status).toBe(401);
    });
});
