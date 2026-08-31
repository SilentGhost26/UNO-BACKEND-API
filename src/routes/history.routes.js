const express = require('express');
const router = express.Router();
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const { historyController } = require('../compositions');

router.get(
    '/games/:gameId/history',
    memoizeMiddleware({ max: 20, maxAge: 5000 }),
    /**
     * #swagger.tags = ['History']
     * #swagger.description = 'get the history of a game'
    */
    historyController.getGameHistory
);

module.exports = router;