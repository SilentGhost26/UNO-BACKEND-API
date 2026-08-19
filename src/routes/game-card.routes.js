const express = require('express');
const router = express.Router();
const { gameCardController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const gameCardSchema = require('../schemas/game-card.schema');

router.post('/games/:gameId/cards', authMiddleware, gameCardController.createDeck);
router.get('/games/:gameId/cards', gameCardController.getCards);
router.get('/games/:gameId/cards/top-card', gameCardController.getTopCardFromDeck);
router.put('/games/:gameId/cards/:cardId', authMiddleware, structureMiddleware(gameCardSchema), gameCardController.updateCard);

module.exports = router;