const { requestStatsService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createRequestStatsController = require('../../../src/controllers/request-stats.controller');

let requestStatsController;

describe('test for request stats controller', () => {
    beforeEach(() => {
        requestStatsController = createRequestStatsController(requestStatsService);
    });

    describe('Tests for getTotalRequests', () => {
        test('get the total requests and responds 200', async () => {
            const req = {};
            const res = createRes();
            requestStatsService.getTotalRequests.mockResolvedValue({ ok: true, result: { totalRequests: 10, breakdown: {} } });

            await requestStatsController.getTotalRequests(req, res);

            expect(requestStatsService.getTotalRequests).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ totalRequests: 10, breakdown: {} });
        });

        test('forward the error when getting the total requests fails', async () => {
            const req = {};
            const res = createRes();
            const next = jest.fn();
            const error = { message: 'something went wrong', statusCode: 500 };
            requestStatsService.getTotalRequests.mockResolvedValue({ ok: false, error });

            await requestStatsController.getTotalRequests(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Tests for getResponseTimes', () => {
        test('get the response times and responds 200', async () => {
            const req = {};
            const res = createRes();
            requestStatsService.getResponseTimes.mockResolvedValue({ ok: true, result: { '/games/': { avg: 100, min: 50, max: 150 } } });

            await requestStatsController.getResponseTimes(req, res);

            expect(requestStatsService.getResponseTimes).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ '/games/': { avg: 100, min: 50, max: 150 } });
        });

        test('forward the error when getting the response times fails', async () => {
            const req = {};
            const res = createRes();
            const next = jest.fn();
            const error = { message: 'something went wrong', statusCode: 500 };
            requestStatsService.getResponseTimes.mockResolvedValue({ ok: false, error });

            await requestStatsController.getResponseTimes(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Tests for getStatusCode', () => {
        test('get the status code counts and responds 200', async () => {
            const req = {};
            const res = createRes();
            requestStatsService.getStatusCode.mockResolvedValue({ ok: true, result: { 200: 8, 404: 2 } });

            await requestStatsController.getStatusCode(req, res);

            expect(requestStatsService.getStatusCode).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 200: 8, 404: 2 });
        });

        test('forward the error when getting the status codes fails', async () => {
            const req = {};
            const res = createRes();
            const next = jest.fn();
            const error = { message: 'something went wrong', statusCode: 500 };
            requestStatsService.getStatusCode.mockResolvedValue({ ok: false, error });

            await requestStatsController.getStatusCode(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Tests for getMostPopularEndpoint', () => {
        test('get the most popular endpoint and responds 200', async () => {
            const req = {};
            const res = createRes();
            requestStatsService.getMostPopularEndpoint.mockResolvedValue({ ok: true, result: { mostPopular: '/games/', requestsCount: 10 } });

            await requestStatsController.getMostPopularEndpoint(req, res);

            expect(requestStatsService.getMostPopularEndpoint).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ mostPopular: '/games/', requestsCount: 10 });
        });

        test('forward the error when getting the most popular endpoint fails', async () => {
            const req = {};
            const res = createRes();
            const next = jest.fn();
            const error = { message: 'something went wrong', statusCode: 500 };
            requestStatsService.getMostPopularEndpoint.mockResolvedValue({ ok: false, error });

            await requestStatsController.getMostPopularEndpoint(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
