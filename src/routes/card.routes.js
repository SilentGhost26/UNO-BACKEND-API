const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const cardSchema = require('../schemas/card.schema');

router.post('/cards/initialize', cardController.createCards);
router.get('/cards', cardController.getAllCards);
router.get('/cards/:id', cardController.getCardById);
router.post('/cards', structureMiddleware(cardSchema), cardController.addCard);
router.put('/cards/:id', structureMiddleware(cardSchema), cardController.updateCard);
router.delete('/cards/:id', cardController.deleteCard);

module.exports = router;