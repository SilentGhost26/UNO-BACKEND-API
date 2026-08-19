const validate = require('../../../src/middlewares/structure.middleware');
const { createRes } = require('../utils/express-mocks.utils');

describe('test for structure middleware', () => {
    test('replace req.body with the validated value and continue', () => {
        const schema = {
            validate: jest.fn().mockReturnValue({ value: { name: 'Ada' } }),
        };
        const req = { body: { name: 'Ada' } };
        const res = createRes();
        const next = jest.fn();

        const middleware = validate(schema);
        middleware(req, res, next);

        expect(schema.validate).toHaveBeenCalledWith(req.body, { abortEarly: false });
        expect(req.body).toEqual({ name: 'Ada' });
        expect(next).toHaveBeenCalled();
    });

    test('forward a validation error with status 400', () => {
        const schema = {
            validate: jest.fn().mockReturnValue({
                error: {
                    details: [{ message: 'name is required' }],
                },
            }),
        };
        const req = { body: { name: '' } };
        const res = createRes();
        const next = jest.fn();

        const middleware = validate(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Validation failed',
            statusCode: 400,
            details: ['name is required'],
        }));
    });
});
