const createMemoize = require('../../../src/middlewares/memoize.middleware');

const { createRes } = require('../utils/express-mocks.utils');

describe('test for memoize middleware', () => {
    let nowSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        nowSpy = jest.spyOn(performance, 'now');
    });

    afterEach(() => {
        nowSpy.mockRestore();
    });

    test('call next without touching the cache when the method is not GET', () => {
        const memoize = createMemoize({ max: 10, maxAge: 5000 });
        const req = { method: 'POST', originalUrl: '/games' };
        const res = createRes();
        const next = jest.fn();

        memoize(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test('call next and register the response on a cache miss', () => {
        const memoize = createMemoize({ max: 10, maxAge: 5000 });
        const req = { method: 'GET', originalUrl: '/games/1' };
        const res = createRes();
        const statusSpy = res.status;
        const jsonSpy = res.json;
        const next = jest.fn(() => {
            res.status(200).json({ id: '1' });
        });
        nowSpy.mockReturnValueOnce(1000);

        memoize(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(jsonSpy).toHaveBeenCalledWith({ id: '1' });
    });

    test('return the cached response without calling next when it has not expired', () => {
        const memoize = createMemoize({ max: 10, maxAge: 5000 });
        const req = { method: 'GET', originalUrl: '/games/1' };

        const firstRes = createRes();
        const firstNext = jest.fn(() => {
            firstRes.status(200).json({ id: '1' });
        });
        nowSpy.mockReturnValueOnce(1000);
        memoize(req, firstRes, firstNext);

        const secondRes = createRes();
        const secondNext = jest.fn();
        nowSpy.mockReturnValueOnce(1000 + 4000);

        memoize(req, secondRes, secondNext);

        expect(secondNext).not.toHaveBeenCalled();
        expect(secondRes.status).toHaveBeenCalledWith(200);
        expect(secondRes.json).toHaveBeenCalledWith({ id: '1' });
    });

    test('call next again and refresh the cache when the entry has expired', () => {
        const memoize = createMemoize({ max: 10, maxAge: 5000 });
        const req = { method: 'GET', originalUrl: '/games/1' };

        const firstRes = createRes();
        const firstNext = jest.fn(() => {
            firstRes.status(200).json({ id: 'old' });
        });
        nowSpy.mockReturnValueOnce(1000);
        memoize(req, firstRes, firstNext);

        const secondRes = createRes();
        const secondStatusSpy = secondRes.status;
        const secondJsonSpy = secondRes.json;
        const secondNext = jest.fn(() => {
            secondRes.status(200).json({ id: 'new' });
        });
        nowSpy.mockReturnValueOnce(7000);
        nowSpy.mockReturnValueOnce(7000);

        memoize(req, secondRes, secondNext);

        expect(secondNext).toHaveBeenCalled();
        expect(secondStatusSpy).toHaveBeenCalledWith(200);
        expect(secondJsonSpy).toHaveBeenCalledWith({ id: 'new' });
    });

    test('treat different urls as different cache keys', () => {
        const memoize = createMemoize({ max: 10, maxAge: 5000 });

        const firstReq = { method: 'GET', originalUrl: '/games/1' };
        const firstRes = createRes();
        nowSpy.mockReturnValueOnce(1000);
        memoize(firstReq, firstRes, () => {
            firstRes.status(200).json({ id: '1' });
        });

        const secondReq = { method: 'GET', originalUrl: '/games/2' };
        const secondRes = createRes();
        const secondJsonSpy = secondRes.json;
        const secondNext = jest.fn(() => {
            secondRes.status(200).json({ id: '2' });
        });
        nowSpy.mockReturnValueOnce(1005);

        memoize(secondReq, secondRes, secondNext);

        expect(secondNext).toHaveBeenCalled();
        expect(secondJsonSpy).toHaveBeenCalledWith({ id: '2' });
    });
    
    test('evict the least used entry when the cache is full and a new key arrives', () => {
        const memoize = createMemoize({ max: 2, maxAge: 100000 });

        const reqA = { method: 'GET', originalUrl: '/games/a' };
        const resA = createRes();
        nowSpy.mockReturnValueOnce(1000);
        memoize(reqA, resA, () => {
            resA.status(200).json({ id: 'a' });
        });

        const reqB = { method: 'GET', originalUrl: '/games/b' };
        const resB = createRes();
        nowSpy.mockReturnValueOnce(1001);
        memoize(reqB, resB, () => {
            resB.status(200).json({ id: 'b' });
        });

        const resAHit = createRes();
        nowSpy.mockReturnValueOnce(1002);
        memoize(reqA, resAHit, jest.fn());

        const reqC = { method: 'GET', originalUrl: '/games/c' };
        const resC = createRes();
        nowSpy.mockReturnValueOnce(1003);
        memoize(reqC, resC, () => {
            resC.status(200).json({ id: 'c' });
        });

        const reqAAgain = { method: 'GET', originalUrl: '/games/a' };
        const resAAgain = createRes();
        const nextAAgain = jest.fn();
        nowSpy.mockReturnValueOnce(1004);
        memoize(reqAAgain, resAAgain, nextAAgain);

        expect(nextAAgain).not.toHaveBeenCalled();
        expect(resAAgain.json).toHaveBeenCalledWith({ id: 'a' });

        const reqBAgain = { method: 'GET', originalUrl: '/games/b' };
        const resBAgain = createRes();
        const nextBAgain = jest.fn(() => {
            resBAgain.status(200).json({ id: 'b-refetched' });
        });
        nowSpy.mockReturnValueOnce(1005);
        memoize(reqBAgain, resBAgain, nextBAgain);

        expect(nextBAgain).toHaveBeenCalled();
    });
});
