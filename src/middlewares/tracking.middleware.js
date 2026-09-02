const { requestStatsService } = require('../compositions');

const trackRequest = (req, res, next) => {
    const start = performance.now();
    
    res.on('finish', async () => {
        try {
            if (req.baseUrl?.includes('/api-docs')) {
                return;
            }

            const request = {
                responseTime: performance.now() - start,
                endpointAccess: (req.baseUrl || '') + (req.route?.path || req.originalUrl),
                requestMethod: req.method,
                statusCode: res.statusCode,
                timestamp: new Date(),
                userId: req.player?.id || null,
            };

            await requestStatsService.addApiRequest(request);
        } catch (err) {
            next(err);
        }
    });

    next();
}

module.exports = trackRequest;