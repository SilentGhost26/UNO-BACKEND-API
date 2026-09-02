const express = require('express');
const router = express.Router();
const { requestStatsController } = require('../compositions');

router.get(
    '/stats/requests', 
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'Get the total requests that has been sent to the server'
    */
    requestStatsController.getTotalRequests
);

router.get(
    '/stats/response-times', 
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'Get the response times of every used endpoint'
    */
    requestStatsController.getResponseTimes
);

router.get(
    '/stats/status-codes', 
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'Get the cuantity of uses of every status code'
    */
    requestStatsController.getStatusCode
);

router.get(
    '/stats/popular-endpoints', 
    /**
     * #swagger.tags = ['Stats']
     * #swagger.description = 'Get the most used endpoint'
    */
    requestStatsController.getMostPopularEndpoint
);
module.exports = router;