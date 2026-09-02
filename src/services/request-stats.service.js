const _ = require('lodash')

const createRequestStatsService = (
    apiRequestRepository,
    apiRequestDto,
    { ok },
) => {
    const addApiRequest = async (apiRequestData) => {
        const apiRequest = apiRequestDto.fromCreateDto(apiRequestData);
        await apiRequestRepository.create(apiRequest);
        return ok();
    }

    const getTotalRequests = async () => {
        const apiRequests = await apiRequestRepository.findAll();
        const totalRequests = apiRequests.length;

        const breakdown = Object.fromEntries(
            Object.entries(_.groupBy(apiRequests, 'endpointAccess'))
                .map(([endpoint, requests]) => {
                    const methods = Object.fromEntries(
                        Object.entries(_.groupBy(requests, 'requestMethod')).
                        map(([method, reqs]) => [
                            method, 
                            reqs.length
                        ])
                    );
                    return [endpoint, methods];
                })
        );

        return ok({ totalRequests: totalRequests, breakdown });
    }

    const getResponseTimes = async () => {
        const apiRequests = await apiRequestRepository.findAll();

        const breakdown = Object.fromEntries(
            Object.entries(_.groupBy(apiRequests, 'endpointAccess'))
                .map(([endpoint, requests]) => {
                    const totalTime = requests.reduce((acc, curr) => curr.responseTime + acc, 0);
                    const avg = parseFloat((totalTime / requests.length).toFixed(3));
                    const min = requests.reduce((acc, curr) => curr.responseTime < acc.responseTime? curr : acc).responseTime;
                    const max = requests.reduce((acc, curr) => curr.responseTime > acc.responseTime? curr : acc).responseTime;
                    return [
                        endpoint, 
                        {avg, min, max}
                    ];
                })
        );
        return ok(breakdown);
    }

    const getStatusCode = async () => {
        const apiRequests = await apiRequestRepository.findAll();

        const codes = Object.fromEntries(
            Object.entries(_.groupBy(apiRequests, 'statusCode'))
                .map(([statusCode, requests]) => [
                    statusCode, 
                    requests.length
                ])
        );
        return ok(codes);
    }

    const getMostPopularEndpoint = async () => {
        const apiRequests = await apiRequestRepository.findAll();

        const requestsCount = Object.fromEntries(
            Object.entries(_.groupBy(apiRequests, 'endpointAccess'))
                .map(([endpoint, requests]) => [
                    endpoint,
                    requests.length
                ])
        );

        const mostPopular = Object.entries(requestsCount)
            .reduce((acc, curr) => curr[1] > acc[1]? curr : acc);

        return ok({ mostPopular: mostPopular[0], requestsCount: mostPopular[1] });
    }

    return { addApiRequest, getTotalRequests, getResponseTimes, getStatusCode, getMostPopularEndpoint };
}

module.exports = createRequestStatsService;