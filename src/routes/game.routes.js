const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const gameSchema = require('../schemas/game.schema');

router.get('/games/:id', gameController.getGameById);
router.post('/games', authMiddleware, structureMiddleware(gameSchema), gameController.addGame);
router.put('/games/:id', authMiddleware, structureMiddleware(gameSchema), gameController.updateGame);
router.put('/games/:id/start', authMiddleware, gameController.startGame);
router.delete('/games/:id', authMiddleware, gameController.deleteGame);

module.exports = router;