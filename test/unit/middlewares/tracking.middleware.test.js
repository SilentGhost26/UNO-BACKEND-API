const trackRequest = require('../../../src/middlewares/tracking.middleware');
const { requestStatsService } = require('../../../src/compositions');

jest.mock('../../../src/compositions', () => ({
    requestStatsService: {
        addApiRequest: jest.fn(),
    },
}));

describe('test for tracking middleware', () => {
    let nowSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        nowSpy = jest.spyOn(performance, 'now');
    });

    afterEach(() => {
        nowSpy.mockRestore();
    });

    test('call next immediately and register a finish listener', () => {
        const req = { baseUrl: '/games', route: { path: '/' }, method: 'GET' };
        const res = { on: jest.fn(), statusCode: 200 };
        const next = jest.fn();
        nowSpy.mockReturnValueOnce(1000);

        trackRequest(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    test('store the request stats when the response finishes', async () => {
        const req = { baseUrl: '/games', route: { path: '/' }, method: 'GET', player: { id: 'player-1' } };
        const res = { on: jest.fn(), statusCode: 200 };
        const next = jest.fn();
        nowSpy.mockReturnValueOnce(1000);
        nowSpy.mockReturnValueOnce(1250);

        trackRequest(req, res, next);
        const finishHandler = res.on.mock.calls[0][1];
        await finishHandler();

        expect(requestStatsService.addApiRequest).toHaveBeenCalledWith(expect.objectContaining({
            responseTime: 250,
            endpointAccess: '/games/',
            requestMethod: 'GET',
            statusCode: 200,
            userId: 'player-1',
            timestamp: expect.any(Date),
        }));
    });

    test('default userId to null when there is no authenticated player', async () => {
        const req = { baseUrl: '/games', route: { path: '/' }, method: 'GET' };
        const res = { on: jest.fn(), statusCode: 200 };
        const next = jest.fn();
        nowSpy.mockReturnValueOnce(1000);
        nowSpy.mockReturnValueOnce(1100);

        trackRequest(req, res, next);
        const finishHandler = res.on.mock.calls[0][1];
        await finishHandler();

        expect(requestStatsService.addApiRequest).toHaveBeenCalledWith(expect.objectContaining({
            userId: null,
        }));
    });

    test('skip storing the request when the base url includes /api-docs', async () => {
        const req = { baseUrl: '/api-docs', route: { path: '/' }, method: 'GET' };
        const res = { on: jest.fn(), statusCode: 200 };
        const next = jest.fn();
        nowSpy.mockReturnValueOnce(1000);

        trackRequest(req, res, next);
        const finishHandler = res.on.mock.calls[0][1];
        await finishHandler();

        expect(requestStatsService.addApiRequest).not.toHaveBeenCalled();
    });
});
