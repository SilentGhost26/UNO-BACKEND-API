const createMemoize = ({ max, maxAge }) => {
    const cache = new Map();

    const memoize = (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const key = `${req.method}:${req.originalUrl}`;
        if (cache.has(key)) {
            const value = cache.get(key);
            if (performance.now() - value.lastTimeUsed <= maxAge) {
                value.lastTimeUsed = performance.now();
                return res.status(value.statusCode).json(value.result);
            }
        } else {
            if (cache.size >= max) {
                const lessUsed = [...cache.entries()].reduce((acc, curr) => curr[1].lastTimeUsed < acc[1].lastTimeUsed? curr : acc);
                const lessUsedKey = lessUsed[0];
                cache.delete(lessUsedKey);
            }
        }
        interceptRes(res, key);
        next();
    }

    function interceptRes(res, key) {
        const originalStatus = res.status.bind(res);
        const originalJson = res.json.bind(res);

        let statusCode;
        res.status = (code) => {
            statusCode = code;
            return originalStatus(code);
        }

        res.json = (body) => {
            cache.set(key, {
                statusCode,
                result: body,
                lastTimeUsed: performance.now(),
            });
            return originalJson(body);
        }
    }

    return memoize;
}

module.exports = createMemoize;