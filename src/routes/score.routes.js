const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/score.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const scoreSchema = require('../schemas/score.schema');
const gamePlayerSchema = require('../schemas/game-player.schema');

router.get('/scores/:id', scoreController.getScoreById);
router.get('/scores/games/:gameId', scoreController.getScoresByGameId);
router.put('/scores/:id', authMiddleware, structureMiddleware(scoreSchema), scoreController.updateScore);

module.exports = router;