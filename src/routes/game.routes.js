const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const gameSchema = require('../schemas/game.schema');

router.get('/games/:id', gameController.getGameById);
router.post('/games', structureMiddleware(gameSchema), gameController.addGame);
router.put('/games/:id', structureMiddleware(gameSchema), gameController.updateGame);
router.delete('/games/:id', gameController.deleteGame);

module.exports = router;