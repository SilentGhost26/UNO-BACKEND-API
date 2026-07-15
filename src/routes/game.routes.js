const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');

router.get('/game/:id', gameController.getGameById);
router.post('/game', gameController.addGame);
router.put('/game/:id', gameController.updateGame);
router.delete('/game/:id', gameController.deleteGame);

module.exports = router;