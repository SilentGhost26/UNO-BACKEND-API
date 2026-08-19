const express = require('express');
const router = express.Router();
const { cardController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const cardSchema = require('../schemas/card.schema');

router.post('/cards/initialize', cardController.createCards);
router.get('/cards', cardController.getAllCards);
router.get('/cards/:id', cardController.getCardById);

module.exports = router;