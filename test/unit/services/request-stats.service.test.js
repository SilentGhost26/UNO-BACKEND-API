const createRequestStatsService = require('../../../src/services/request-stats.service');
const { ok } = require('../../../src/helpers/result.helper');
const { apiRequestRepository } = require('../utils/repository-mocks.utils');
const apiRequestDto = require('../../../src/dto/api-request.dto');

let requestStatsService;

describe('test for request stats service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        requestStatsService = createRequestStatsService(
            apiRequestRepository,
            apiRequestDto,
            { ok },
        );
    });

    describe('Tests for addApiRequest', () => {
        test('store a new api request successfully', async () => {
            const apiRequestData = {
                responseTime: 120,
                endpointAccess: '/games/',
                requestMethod: 'GET',
                statusCode: 200,
                timestamp: '2026-07-28T00:00:00.000Z',
                userId: 'player-1',
            };

            const result = await requestStatsService.addApiRequest(apiRequestData);

            expect(apiRequestRepository.create).toHaveBeenCalledWith(apiRequestData);
            expect(result).toEqual({ ok: true, result: undefined });
        });
    });

    describe('Tests for getTotalRequests', () => {
        test('get the total requests and the breakdown by endpoint and method', async () => {
            apiRequestRepository.findAll.mockResolvedValue([
                { endpointAccess: '/games/', requestMethod: 'GET' },
                { endpointAccess: '/games/', requestMethod: 'GET' },
                { endpointAccess: '/games/', requestMethod: 'POST' },
                { endpointAccess: '/players/', requestMethod: 'GET' },
            ]);

            const result = await requestStatsService.getTotalRequests();

            expect(result.result).toEqual({
                totalRequests: 4,
                breakdown: {
                    '/games/': { GET: 2, POST: 1 },
                    '/players/': { GET: 1 },
                },
            });
        });

        test('return an empty breakdown when there are no requests', async () => {
            apiRequestRepository.findAll.mockResolvedValue([]);

            const result = await requestStatsService.getTotalRequests();

            expect(result.result).toEqual({ totalRequests: 0, breakdown: {} });
        });
    });

    describe('Tests for getResponseTimes', () => {
        test('get the average, min and max response time per endpoint', async () => {
            apiRequestRepository.findAll.mockResolvedValue([
                { endpointAccess: '/games/', responseTime: 100 },
                { endpointAccess: '/games/', responseTime: 200 },
                { endpointAccess: '/players/', responseTime: 50 },
            ]);

            const result = await requestStatsService.getResponseTimes();

            expect(result.result).toEqual({
                '/games/': { avg: 150, min: 100, max: 200 },
                '/players/': { avg: 50, min: 50, max: 50 },
            });
        });
    });

    describe('Tests for getStatusCode', () => {
        test('get the count of requests per status code', async () => {
            apiRequestRepository.findAll.mockResolvedValue([
                { statusCode: 200 },
                { statusCode: 200 },
                { statusCode: 404 },
            ]);

            const result = await requestStatsService.getStatusCode();

            expect(result.result).toEqual({ 200: 2, 404: 1 });
        });
    });

    describe('Tests for getMostPopularEndpoint', () => {
        test('get the endpoint with the most requests', async () => {
            apiRequestRepository.findAll.mockResolvedValue([
                { endpointAccess: '/games/' },
                { endpointAccess: '/games/' },
                { endpointAccess: '/players/' },
            ]);

            const result = await requestStatsService.getMostPopularEndpoint();

            expect(result.result).toEqual({ mostPopular: '/games/', requestsCount: 2 });
        });
    });
});
