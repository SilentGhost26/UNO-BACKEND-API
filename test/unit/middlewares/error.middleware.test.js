const processError = require('../../../src/middlewares/error.middleware');
const { createRes } = require('../utils/express-mocks.utils');

describe('test for error middleware', () => {
    test('respond with the default status and details', () => {
        const req = {};
        const res = createRes();
        const next = jest.fn();
        const error = new Error('something went wrong');

        processError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'something went wrong',
            details: [],
        });
    });

    test('respond with the custom status and details from the error', () => {
        const req = {};
        const res = createRes();
        const next = jest.fn();
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.details = ['field is required'];

        processError(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Validation failed',
            details: ['field is required'],
        });
    });
});
