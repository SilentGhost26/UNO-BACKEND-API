const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/score.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const scoreSchema = require('../schemas/score.schema');
const gamePlayerSchema = require('../schemas/game-player.schema');

router.get('/scores/:id', scoreController.getScoreById);
router.get('/scores/games/:gameId', scoreController.getScoresByGameId);
router.post('/scores', structureMiddleware(gamePlayerSchema), scoreController.addScore);
router.put('/scores/:id', structureMiddleware(scoreSchema), scoreController.updateScore);
router.delete('/scores/:id', scoreController.deleteScore);

module.exports = router;