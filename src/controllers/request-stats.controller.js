const createRequestStatsController = (requestStatsService) => {
    const getTotalRequests = async (req, res, next) => {
        const totalRequests = await requestStatsService.getTotalRequests();

        if (!totalRequests.ok) {
            return next(totalRequests.error);
        }

        res.status(200).json(totalRequests.result);
    }

    const getResponseTimes = async (req, res, next) => {
        const responseTimes = await requestStatsService.getResponseTimes();

        if (!responseTimes.ok) {
            return next(responseTimes.error);
        }

        res.status(200).json(responseTimes.result);
    }

    const getStatusCode = async (req, res, next) => {
        const statusCodes = await requestStatsService.getStatusCode();

        if (!statusCodes.ok) {
            return next(statusCodes.error);
        }

        res.status(200).json(statusCodes.result);
    }

    const getMostPopularEndpoint = async (req, res, next) => {
        const mostPopular = await requestStatsService.getMostPopularEndpoint();

        if (!mostPopular.ok) {
            return next(mostPopular.error);
        }

        res.status(200).json(mostPopular.result);
    }

    return { getTotalRequests, getResponseTimes, getStatusCode, getMostPopularEndpoint };
}

module.exports = createRequestStatsController;