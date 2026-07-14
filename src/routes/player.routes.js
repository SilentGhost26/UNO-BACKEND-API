const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');

router.get('/player/:id', playerController.getPlayerById);
router.post('/player', playerController.addPlayer);
router.put('/player/:id', playerController.updatePlayer);
router.delete('/player/:id', playerController.deletePlayer);

module.exports = router;