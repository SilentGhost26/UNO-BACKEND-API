const express = require('express');
const router = express.Router();
const { cardController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const memoizeMiddleware = require('../middlewares/memoize.middleware');
const cardSchema = require('../schemas/card.schema');

router.post(
    '/cards/initialize', 
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Initialize the cards of the original game'
    */
    cardController.createCards
);
router.get(
    '/cards',
    memoizeMiddleware({ max: 1, maxAge: 600000 }),
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Get all cards'
    */
    cardController.getAllCards
);
router.get(
    '/cards/:id', 
    memoizeMiddleware({ max: 108, maxAge: 600000 }),
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Get a specific card based on the ID'
    */    
    cardController.getCardById
);

module.exports = router;