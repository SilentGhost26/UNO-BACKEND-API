const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const cardSchema = require('../schemas/card.schema');

/**
 * #swagger.tags = ['Cards']
 */
router.post('/cards/initialize', cardController.createCards);

/**
 * #swagger.tags = ['Cards']
 */
router.get('/cards', cardController.getAllCards);

/**
 * #swagger.tags = ['Cards']
 */
router.get('/cards/:id', cardController.getCardById);

/**
 * @swagger
 * #swagger.tags = ['Cards']
 * #swagger.parameters['body'] = {
 *  in: 'body',
 *  required: true,
 *  schema: { color: 'string', value: 'string', type: 'string' }
 * }
 */
router.post('/cards', structureMiddleware(cardSchema), cardController.addCard);

/**
 * #swagger.tags = ['Cards']
 * #swagger.parameters['body'] = {
 *  in: 'body',
 *  required: true,
 *  schema: { color: 'string', value: 'string', type: 'string' }
 * }
 */
router.put('/cards/:id', structureMiddleware(cardSchema), cardController.updateCard);

/**
 * #swagger.tags = ['Cards']
 */
router.delete('/cards/:id', cardController.deleteCard);

module.exports = router;