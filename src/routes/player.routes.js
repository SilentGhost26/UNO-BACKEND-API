const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const playerSchema = require('../schemas/player.schema');

router.get('/player/:id', playerController.getPlayerById);
router.post('/player', structureMiddleware(playerSchema), playerController.addPlayer);
router.put('/player/:id', structureMiddleware(playerSchema), playerController.updatePlayer);
router.delete('/player/:id', playerController.deletePlayer);

module.exports = router;