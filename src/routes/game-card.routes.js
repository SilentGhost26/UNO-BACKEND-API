const express = require('express');
const router = express.Router();
const gameCardController = require('../controllers/game-card.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const gameCardSchema = require('../schemas/game-card.schema');

router.post('/games/:gameId/cards', gameCardController.createDeck);
router.get('/games/:gameId/cards', gameCardController.getCards);
router.put('/games/:gameId/cards/:cardId', structureMiddleware(gameCardSchema), gameCardController.updateCard);

module.exports = router;