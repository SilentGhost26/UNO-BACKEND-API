const { fromCreateDto } = require('../../../src/dto/api-request.dto');

describe('fromCreateDto', () => {
    test('should get a create api request object', () => {
        const data = {
            responseTime: 120.5,
            endpointAccess: '/games/',
            requestMethod: 'GET',
            statusCode: 200,
            timestamp: '2026-07-28T00:00:00.000Z',
            userId: 'player-1',
        };

        const apiRequest = {
            responseTime: 120.5,
            endpointAccess: '/games/',
            requestMethod: 'GET',
            statusCode: 200,
            timestamp: '2026-07-28T00:00:00.000Z',
            userId: 'player-1',
        };

        expect(fromCreateDto(data)).toStrictEqual(apiRequest);
    });

    test('should not mutate the original object', () => {
        const data = {
            responseTime: 120.5,
            endpointAccess: '/games/',
            requestMethod: 'GET',
            statusCode: 200,
            timestamp: '2026-07-28T00:00:00.000Z',
            userId: 'player-1',
        };

        const copy = { ...data };

        fromCreateDto(data);
        expect(data).toEqual(copy);
    });

    test('should map userId as null when it is not provided', () => {
        const data = {
            responseTime: 80,
            endpointAccess: '/games/',
            requestMethod: 'GET',
            statusCode: 200,
            timestamp: '2026-07-28T00:00:00.000Z',
            userId: null,
        };

        expect(fromCreateDto(data).userId).toBeNull();
    });
});
