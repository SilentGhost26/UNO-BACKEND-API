const express = require('express');
const router = express.Router();
const { historyController } = require('../compositions');

router.get(
    '/games/:gameId/history',
    /**
     * #swagger.tags = ['History']
     * #swagger.description = 'get the history of a game'
    */
    historyController.getGameHistory
);

module.exports = router;
