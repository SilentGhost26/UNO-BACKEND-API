const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const gameSchema = require('../schemas/game.schema');

router.get('/game/:id', gameController.getGameById);
router.post('/game', structureMiddleware(gameSchema), gameController.addGame);
router.put('/game/:id', structureMiddleware(gameSchema), gameController.updateGame);
router.delete('/game/:id', gameController.deleteGame);

module.exports = router;